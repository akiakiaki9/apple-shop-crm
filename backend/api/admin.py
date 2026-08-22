from django.contrib import admin
from django.utils.html import format_html
from .models import Product, Device, Purchase, Sale

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'product_type', 'ram', 'storage', 'color', 'serial_number', 'created_at']
    list_filter = ['product_type', 'name']
    search_fields = ['name', 'serial_number']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'product_type')
        }),
        ('Характеристики для телефона', {
            'fields': ('ram', 'storage', 'color'),
            'classes': ('collapse',)
        }),
        ('Характеристики для аксессуара', {
            'fields': ('serial_number',),
            'classes': ('collapse',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['id', 'imei', 'product', 'status', 'purchase_price', 'sale_price', 'created_at']
    list_filter = ['status', 'product__product_type', 'created_at']
    search_fields = ['imei', 'product__name']
    readonly_fields = ['created_at', 'sold_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('product', 'imei', 'status')
        }),
        ('Цены', {
            'fields': ('purchase_price', 'extra_expenses', 'sale_price')
        }),
        ('Связи', {
            'fields': ('purchase', 'sale')
        }),
        ('Даты', {
            'fields': ('created_at', 'sold_at')
        }),
    )

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'formatted_date', 'supplier_name', 'total_count', 'devices_total', 'extra_expenses', 'total_price']
    list_filter = ['created_at', 'supplier_name']
    search_fields = ['supplier_name', 'comment', 'devices__imei']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('supplier_name', 'comment')
        }),
        ('Расходы', {
            'fields': ('extra_expenses', 'extra_expenses_comment')
        }),
        ('Дата', {
            'fields': ('created_at',)
        }),
        ('Статистика', {
            'fields': ('total_count', 'devices_total', 'total_price'),
            'classes': ('collapse',)
        }),
    )

    def formatted_date(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M')
    formatted_date.short_description = 'Дата'
    formatted_date.admin_order_field = 'created_at'

    def total_count(self, obj):
        return obj.total_count()
    total_count.short_description = 'Количество'

    def devices_total(self, obj):
        return f"{obj.devices_total():,} сум"
    devices_total.short_description = 'Стоимость товаров'

    def total_price(self, obj):
        return f"{obj.total_price():,} сум"
    total_price.short_description = 'Общая стоимость'

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'formatted_date', 'product_info', 'imei_info', 'sale_price', 'profit_display', 'status_display']
    list_filter = ['created_at', 'device__status']
    search_fields = ['device__imei', 'device__product__name', 'comment']
    readonly_fields = ['created_at', 'profit_display']
    fieldsets = (
        ('Основная информация', {
            'fields': ('device', 'sale_price', 'comment')
        }),
        ('Информация об устройстве', {
            'fields': ('device_info', 'imei_info'),
            'classes': ('collapse',)
        }),
        ('Финансы', {
            'fields': ('purchase_price', 'extra_expenses', 'total_cost', 'profit_display'),
            'classes': ('collapse',)
        }),
        ('Дата', {
            'fields': ('created_at',)
        }),
    )

    def formatted_date(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M')
    formatted_date.short_description = 'Дата'
    formatted_date.admin_order_field = 'created_at'

    def product_info(self, obj):
        if obj.device and obj.device.product:
            return obj.device.product.name
        return '-'
    product_info.short_description = 'Товар'

    def imei_info(self, obj):
        if obj.device:
            return obj.device.imei or '-'
        return '-'
    imei_info.short_description = 'IMEI/Номер'

    def status_display(self, obj):
        if obj.device:
            status = obj.device.status
            if status == 'SOLD':
                return format_html('<span style="color: green;">✅ Продан</span>')
            else:
                return format_html('<span style="color: orange;">🔄 В наличии</span>')
        return '-'
    status_display.short_description = 'Статус'

    def purchase_price(self, obj):
        if obj.device:
            return f"{obj.device.purchase_price:,} сум"
        return '-'
    purchase_price.short_description = 'Закупка'

    def extra_expenses(self, obj):
        if obj.device and obj.device.extra_expenses > 0:
            return f"{obj.device.extra_expenses:,} сум"
        return '0 сум'
    extra_expenses.short_description = 'Доп. расходы'

    def total_cost(self, obj):
        if obj.device:
            cost = obj.device.purchase_price + obj.device.extra_expenses
            return f"{cost:,} сум"
        return '-'
    total_cost.short_description = 'Себестоимость'

    def profit_display(self, obj):
        profit = obj.profit()
        if profit is not None:
            color = 'green' if profit >= 0 else 'red'
            return format_html(f'<span style="color: {color}; font-weight: bold;">{profit:,} сум</span>')
        return '-'
    profit_display.short_description = 'Прибыль'
    profit_display.admin_order_field = 'profit'