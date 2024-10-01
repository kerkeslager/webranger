from django.shortcuts import redirect

def index(request):
    if request.user.is_authenticated:
        return redirect('auth:login')
    else:
        return redirect('editor:new')
