from rest_framework import serializers
from .models import Product, Device, Purchase, Sale

class ProductSerializer(serializers.ModelSerializer):
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'product_type', 'product_type_display', 'ram', 'storage', 'color', 'serial_number', 'created_at', 'updated_at']

class DeviceSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_type = serializers.CharField(source='product.product_type', read_only=True)
    product_type_display = serializers.CharField(source='product.get_product_type_display', read_only=True)
    product_ram = serializers.CharField(source='product.ram', read_only=True)
    product_storage = serializers.CharField(source='product.storage', read_only=True)
    product_color = serializers.CharField(source='product.color', read_only=True)
    product_serial = serializers.CharField(source='product.serial_number', read_only=True)  # Добавляем
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    profit = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    purchase_date = serializers.DateTimeField(source='purchase.created_at', read_only=True)
    sale_date = serializers.DateTimeField(source='sold_at', read_only=True)

    class Meta:
        model = Device
        fields = [
            'id', 'product', 'product_name', 'product_type', 'product_type_display',
            'product_ram', 'product_storage', 'product_color', 'product_serial',
            'imei', 'purchase_price', 'extra_expenses', 'total_cost',
            'sale_price', 'status', 'status_display',
            'purchase', 'sale', 'created_at', 'sold_at', 'profit',
            'purchase_date', 'sale_date'
        ]

    def get_total_cost(self, obj):
        return obj.total_cost()

    def get_profit(self, obj):
        if obj.sale_price and obj.purchase_price:
            return obj.sale_price - obj.total_cost()
        return None

class PurchaseSerializer(serializers.ModelSerializer):
    devices = DeviceSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    devices_total = serializers.SerializerMethodField()
    total_count = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = ['id', 'supplier_name', 'comment', 'extra_expenses', 'extra_expenses_comment',
                  'created_at', 'formatted_date', 'devices', 'total_price', 'devices_total', 'total_count']

    def get_total_price(self, obj):
        return obj.total_price()

    def get_devices_total(self, obj):
        return obj.devices_total()

    def get_total_count(self, obj):
        return obj.total_count()

    def get_formatted_date(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M')

class SaleSerializer(serializers.ModelSerializer):
    device_info = DeviceSerializer(source='device', read_only=True)
    profit = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ['id', 'device', 'device_info', 'sale_price', 'comment', 
                  'created_at', 'formatted_date', 'profit']

    def get_profit(self, obj):
        return obj.profit()

    def get_formatted_date(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M')