{
    'name': "Time-off Debranding for Viindoo",
    'name_vi_VN': "Nghỉ với Thương hiệu Viindoo",

    'summary': """
Debranding Time-off for Viindoo
    """,
    'summary_vi_VN': """
Làm lại theme / brand của Time-off theo Thương hiệu Viindoo
    """,

    'description': """

Editions Supported
==================
1. Community Edition

    """,

    'description_vi_VN': """

Ấn bản được Hỗ trợ
==================
1. Ấn bản Community


    """,

    'author': "Viindoo",
    'website': "https://viindoo.com",
    'live_test_url': "https://v14demo-int.viindoo.com",
    'live_test_url_vi_VN': "https://v14demo-vn.viindoo.com",
    'support': "apps.support@viindoo.com",
    'category': 'Hidden',
    'version': '0.1.0',

    # any module necessary for this one to work correctly
    'depends': ['viin_brand_mail', 'hr_holidays'],

    # always loaded
    'data': [
        'views/assets.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': True,
    'price': 9.9,
    'currency': 'EUR',
    'license': 'OPL-1',
}
