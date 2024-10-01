from django.urls import include, path

from . import views

app_name = 'editor'

urlpatterns = [
    path('new', views.new, name='new'),
]
