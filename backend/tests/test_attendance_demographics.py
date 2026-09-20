import unittest
from datetime import date

from app.utils.attendance_demographics import age_group, normalize_gender


class AttendanceDemographicsTests(unittest.TestCase):
    def test_gender_accepts_current_and_legacy_values(self):
        self.assertEqual(normalize_gender("Masculino"), "Masculino")
        self.assertEqual(normalize_gender("m"), "Masculino")
        self.assertEqual(normalize_gender("F"), "Femenino")
        self.assertEqual(normalize_gender(" mujer "), "Femenino")

    def test_unknown_gender_is_not_counted_as_female(self):
        self.assertIsNone(normalize_gender(""))
        self.assertIsNone(normalize_gender("sin registrar"))

    def test_age_uses_the_service_date_and_exact_birthday(self):
        self.assertEqual(age_group(date(2013, 9, 11), date(2026, 9, 10)), "Niño")
        self.assertEqual(age_group(date(2013, 9, 10), date(2026, 9, 10)), "Adolescente")
        self.assertEqual(age_group(date(2008, 9, 10), date(2026, 9, 10)), "Joven")
        self.assertEqual(age_group(date(1990, 9, 10), date(2026, 9, 10)), "Adulto")
        self.assertEqual(age_group(date(1965, 9, 10), date(2026, 9, 10)), "Adulto Mayor")

    def test_age_ranges_change_on_the_exact_limit(self):
        service_date = date(2026, 9, 10)
        self.assertEqual(age_group(date(2014, 9, 10), service_date), "Niño")
        self.assertEqual(age_group(date(2009, 9, 10), service_date), "Adolescente")
        self.assertEqual(age_group(date(1991, 9, 10), service_date), "Joven")
        self.assertEqual(age_group(date(1966, 9, 10), service_date), "Adulto")
        self.assertEqual(age_group(date(1965, 9, 10), service_date), "Adulto Mayor")

    def test_missing_birth_date_stays_unclassified(self):
        self.assertIsNone(age_group(None, date(2026, 9, 10)))


if __name__ == "__main__":
    unittest.main()
