# Generated by Django 4.1.7 on 2023-03-30 08:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0012_alter_user_cover'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='cover',
            field=models.ImageField(blank=True, default='cover/default_cover_image.png', upload_to='covers/'),
        ),
    ]
