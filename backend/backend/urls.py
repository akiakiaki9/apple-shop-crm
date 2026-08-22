from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.contrib.auth import logout
from django.contrib.auth import authenticate, login
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from api import views

router = DefaultRouter()
router.register('products', views.ProductViewSet)
router.register('devices', views.DeviceViewSet)
router.register('purchases', views.PurchaseViewSet)
router.register('sales', views.SaleViewSet)

@method_decorator(csrf_protect, name='dispatch')
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '')
        password = request.data.get('password', '')
        user = authenticate(request, username=username, password=password)

        if user is None or not user.is_active:
            return Response(
                {'error': 'Неверный логин или пароль'},
                status=status.HTTP_400_BAD_REQUEST
            )

        login(request, user)
        return Response({'username': user.get_username()})


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({'message': 'Успешно вышли'})


class SessionCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'username': request.user.get_username()})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/csrf/', CsrfView.as_view(), name='csrf'),
    path('api-auth/login/', LoginView.as_view(), name='json_login'),
    path('api-auth/logout/', LogoutView.as_view(), name='json_logout'),
    path('api-auth/check/', SessionCheckView.as_view(), name='session_check'),
]