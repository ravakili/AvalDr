from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'در انتظار'),
                    ('success', 'موفق'),
                    ('failed', 'ناموفق'),
                    ('refunded', 'بازپرداخت شده'),
                    ('refund-failed', 'خطای بازپرداخت'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='authority',
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.AddField(
            model_name='payment',
            name='gateway_url',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='refund_amount',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='payment',
            name='refund_error',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='refund_id',
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name='payment',
            name='refunded_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
