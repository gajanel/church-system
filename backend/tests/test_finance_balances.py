import unittest

from app.utils.finance_balances import cash_balance, contributor_name, calculate_tithe


class FinanceBalanceTests(unittest.TestCase):
    def test_cash_balance_includes_all_cash_movements(self):
        self.assertEqual(cash_balance(1000, 250, 300, 200), 750)

    def test_previous_closing_balance_becomes_next_opening_balance(self):
        january_close = cash_balance(1000, 100, 250, 150)
        february_close = january_close + cash_balance(500, 50, 100, 25)
        self.assertEqual(january_close, 700)
        self.assertEqual(february_close, 1125)

    def test_tithe_reduces_cash_by_ten_percent_of_offerings(self):
        tithe = 150 * 0.10
        self.assertEqual(cash_balance(offerings=150, tithe=tithe), 135)

    def test_contributor_uses_selected_member_name(self):
        member = type("Member", (), {"first_name": "Ana", "last_name": "López"})()
        self.assertEqual(contributor_name(None, member), "Ana López")

    def test_typed_contributor_name_has_priority(self):
        member = type("Member", (), {"first_name": "Ana", "last_name": "López"})()
        self.assertEqual(contributor_name("Invitado", member), "Invitado")

    def test_tithe_uses_configured_percentage(self):
        self.assertEqual(calculate_tithe(875, 7.5), 65.63)


if __name__ == "__main__":
    unittest.main()
