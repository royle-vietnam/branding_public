from odoo import fields, models


class FinancialYearOpeningWizard(models.TransientModel):
    _inherit = 'account.financial.year.op'

    opening_date = fields.Date(
        help="Date from which the accounting is managed in Viindoo. It is the date of the opening entry.")
