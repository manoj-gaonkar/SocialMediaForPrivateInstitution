from datetime import datetime
from django import template
register = template.Library()


@register.filter(name="hours_since")
def hours_since(value):
    if isinstance(value, str):
        value = datetime.strptime(value, '%H:%M')
    print("cool")
    now = datetime.now()
    delta = now - value
    hours = delta.seconds//3600
    return hours
