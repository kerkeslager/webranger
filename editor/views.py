from django.views.generic.base import TemplateView

class New(TemplateView):
    template_name = 'editor/new.html'

new = New.as_view()
