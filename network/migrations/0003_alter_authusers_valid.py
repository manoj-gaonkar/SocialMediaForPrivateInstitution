# Generated by Django 4.0.5 on 2023-03-08 16:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0002_authusers'),
    ]

    operations = [
        migrations.AlterField(
            model_name='authusers',
            name='valid',
            field=models.BooleanField(default=True),
        ),
    ]
