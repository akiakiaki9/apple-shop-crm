from django.db import models
from django.utils import timezone

class Product(models.Model):
    """Модель товара"""
    class ProductType(models.TextChoices):
        PHONE = 'PHONE', 'Телефон'
        ACCESSORY = 'ACCESSORY', 'Аксессуар'

    name = models.CharField(max_length=100, verbose_name='Название')
    product_type = models.CharField(max_length=10, choices=ProductType.choices, default=ProductType.PHONE, verbose_name='Тип товара')
    ram = models.CharField(max_length=20, blank=True, null=True, verbose_name='Оперативная память')
    storage = models.CharField(max_length=20, blank=True, null=True, verbose_name='Память')
    color = models.CharField(max_length=50, blank=True, null=True, verbose_name='Цвет')
    serial_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Серийный номер')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлен')

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['name', 'product_type']

    def __str__(self):
        if self.product_type == 'PHONE':
            return f"{self.name} - {self.ram} - {self.storage} - {self.color}"
        else:
            return f"{self.name} (Аксессуар)"

class Purchase(models.Model):
    """Модель прихода"""
    supplier_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Поставщик')
    comment = models.TextField(blank=True, null=True, verbose_name='Комментарий')
    extra_expenses = models.DecimalField(max_digits=15, decimal_places=0, default=0, verbose_name='Дополнительные расходы')
    extra_expenses_comment = models.CharField(max_length=200, blank=True, null=True, verbose_name='Комментарий к расходам')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата прихода')

    class Meta:
        verbose_name = 'Приход'
        verbose_name_plural = 'Приходы'
        ordering = ['-created_at']

    def __str__(self):
        return f"Приход №{self.id} от {self.created_at.strftime('%d.%m.%Y %H:%M')}"

    def total_price(self):
        """Общая стоимость прихода (товар + доп расходы)"""
        devices_total = sum(device.purchase_price for device in self.devices.all())
        return devices_total + self.extra_expenses

    def devices_total(self):
        """Стоимость только устройств"""
        return sum(device.purchase_price for device in self.devices.all())

    def total_count(self):
        """Количество устройств в приходе"""
        return self.devices.count()

class Device(models.Model):
    """Модель устройства (конкретный телефон или аксессуар)"""
    class Status(models.TextChoices):
        IN_STOCK = 'IN_STOCK', 'В наличии'
        SOLD = 'SOLD', 'Продан'

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='devices', verbose_name='Товар')
    imei = models.CharField(max_length=50, blank=True, null=True, verbose_name='IMEI/Серийный номер')
    purchase_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='Закупочная цена')
    extra_expenses = models.DecimalField(max_digits=15, decimal_places=0, default=0, verbose_name='Дополнительные расходы на устройство')
    sale_price = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True, verbose_name='Цена продажи')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.IN_STOCK, verbose_name='Статус')
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='devices', verbose_name='Приход')
    sale = models.ForeignKey('Sale', on_delete=models.SET_NULL, null=True, blank=True, related_name='devices', verbose_name='Продажа')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    sold_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата продажи')

    class Meta:
        verbose_name = 'Устройство'
        verbose_name_plural = 'Устройства'
        ordering = ['-created_at']

    def __str__(self):
        if self.imei:
            return f"{self.product} - {self.imei}"
        return f"{self.product}"

    def total_cost(self):
        """Общая себестоимость устройства (закупка + доп расходы)"""
        return self.purchase_price + self.extra_expenses

    def profit(self):
        """Прибыль от устройства"""
        if self.sale_price and self.purchase_price:
            return self.sale_price - self.total_cost()
        return None

class Sale(models.Model):
    """Модель продажи"""
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='sales', verbose_name='Устройство')
    sale_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='Цена продажи')
    comment = models.TextField(blank=True, null=True, verbose_name='Комментарий')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата продажи')

    class Meta:
        verbose_name = 'Продажа'
        verbose_name_plural = 'Продажи'
        ordering = ['-created_at']

    def __str__(self):
        return f"Продажа №{self.id} от {self.created_at.strftime('%d.%m.%Y %H:%M')}"

    def profit(self):
        """Расчет прибыли с учетом доп расходов"""
        if self.device and self.device.purchase_price:
            total_cost = self.device.purchase_price + self.device.extra_expenses
            return self.sale_price - total_cost
        return 0