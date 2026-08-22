from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Product, Device, Purchase, Sale
from .serializers import (
    ProductSerializer, DeviceSerializer, 
    PurchaseSerializer, SaleSerializer
)

@method_decorator(csrf_exempt, name='dispatch')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def available_imeis(self, request, pk=None):
        """Получить доступные устройства для товара"""
        product = self.get_object()
        
        # Получаем все устройства в наличии для этого товара
        devices = product.devices.filter(status=Device.Status.IN_STOCK)
        
        # Формируем список устройств
        device_list = []
        for device in devices:
            # Для телефонов используем IMEI
            if product.product_type == 'PHONE':
                identifier = device.imei or 'Без IMEI'
            else:
                # Для аксессуаров - используем IMEI или создаем идентификатор
                if device.imei:
                    identifier = device.imei
                else:
                    identifier = f"Товар #{device.id}"
            
            device_list.append({
                'id': device.id,
                'identifier': identifier,
                'imei': device.imei,
                'serial_number': product.serial_number,
                'product_type': product.product_type,
                'purchase_price': device.purchase_price,
                'extra_expenses': device.extra_expenses,
            })
        
        return Response({
            'count': len(device_list),
            'devices': device_list
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            product_data = request.data
            product_type = product_data.get('product_type', 'PHONE')
            
            # Проверяем существование товара
            if product_type == 'PHONE':
                existing = Product.objects.filter(
                    name=product_data.get('name'),
                    product_type=product_type,
                    ram=product_data.get('ram', ''),
                    storage=product_data.get('storage', ''),
                    color=product_data.get('color', '')
                )
            else:
                # Для аксессуаров проверяем по имени и серийному номеру
                existing = Product.objects.filter(
                    name=product_data.get('name'),
                    product_type=product_type,
                    serial_number=product_data.get('serial_number', '')
                )
            
            if existing.exists():
                return Response(
                    {'error': 'Товар с такими характеристиками уже существует'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Введите запрос для поиска'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ищем по IMEI или серийному номеру или названию
        devices = Device.objects.filter(
            Q(imei__icontains=query) | 
            Q(product__serial_number__icontains=query) |
            Q(product__name__icontains=query)
        )
        
        if not devices.exists():
            return Response({'error': 'Устройство не найдено'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(devices, many=True)
        return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')
class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_purchase(self, request):
        data = request.data
        imeis_text = data.get('imeis', '')
        imeis = [i.strip() for i in imeis_text.split('\n') if i.strip()]
        
        if not imeis:
            return Response({'error': 'Не указаны IMEI/номера'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(set(imeis)) != len(imeis):
            return Response({'error': 'Есть дубликаты в списке'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверяем существование IMEI/номеров
        existing = Device.objects.filter(imei__in=imeis)
        if existing.exists():
            return Response({
                'error': f'IMEI/номера уже существуют: {", ".join([d.imei for d in existing])}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        product_type = data.get('product_type', 'PHONE')
        product_name = data.get('product_name')
        
        # Создаем или получаем товар
        if product_type == 'PHONE':
            product, created = Product.objects.get_or_create(
                name=product_name,
                product_type=product_type,
                ram=data.get('ram', ''),
                storage=data.get('storage', ''),
                color=data.get('color', ''),
                defaults={'serial_number': ''}
            )
        else:
            # Для аксессуаров
            product, created = Product.objects.get_or_create(
                name=product_name,
                product_type=product_type,
                serial_number=data.get('serial_number', ''),
                defaults={
                    'ram': '',
                    'storage': '',
                    'color': ''
                }
            )
        
        purchase = Purchase.objects.create(
            supplier_name=data.get('supplier_name', ''),
            comment=data.get('comment', ''),
            extra_expenses=data.get('extra_expenses', 0),
            extra_expenses_comment=data.get('extra_expenses_comment', '')
        )
        
        purchase_price = data.get('purchase_price')
        extra_expenses = data.get('extra_expenses', 0)
        per_device_extra = extra_expenses / len(imeis) if len(imeis) > 0 else 0
        
        devices = []
        for imei in imeis:
            device = Device.objects.create(
                product=product,
                imei=imei,
                purchase_price=purchase_price,
                extra_expenses=per_device_extra,
                purchase=purchase
            )
            devices.append(device)
        
        serializer = self.get_serializer(purchase)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@method_decorator(csrf_exempt, name='dispatch')
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_sale(self, request):
        data = request.data
        device_id = data.get('device_id')
        sale_price = data.get('sale_price')
        
        try:
            device = Device.objects.get(id=device_id, status=Device.Status.IN_STOCK)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Товар не найден или уже продан'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sale = Sale.objects.create(
            device=device,
            sale_price=sale_price,
            comment=data.get('comment', '')
        )
        
        device.status = Device.Status.SOLD
        device.sale_price = sale_price
        device.sold_at = sale.created_at
        device.sale = sale
        device.save()
        
        serializer = self.get_serializer(sale)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        period = request.query_params.get('period', 'all')
        
        now = timezone.now()
        start_date = None
        end_date = None
        
        if period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'yesterday':
            start_date = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
        elif period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'current_month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == 'last_month':
            first_day_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            start_date = first_day_current - timedelta(days=1)
            start_date = start_date.replace(day=1)
            end_date = first_day_current - timedelta(microseconds=1)
        
        sales = Sale.objects.all()
        if start_date:
            if period == 'yesterday' and end_date:
                sales = sales.filter(created_at__gte=start_date, created_at__lt=end_date)
            else:
                sales = sales.filter(created_at__gte=start_date)
        
        total_count = sales.count()
        total_revenue = sales.aggregate(Sum('sale_price'))['sale_price__sum'] or 0
        
        total_cost = 0
        for sale in sales:
            if sale.device:
                total_cost += sale.device.purchase_price + sale.device.extra_expenses
        
        total_profit = total_revenue - total_cost
        
        avg_profit = total_profit / total_count if total_count > 0 else 0
        avg_price = total_revenue / total_count if total_count > 0 else 0
        margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return Response({
            'period': period,
            'total_count': total_count,
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'total_profit': total_profit,
            'avg_profit': avg_profit,
            'avg_price': avg_price,
            'margin': margin,
        })