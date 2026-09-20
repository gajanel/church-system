import unittest
from datetime import date

from pydantic import ValidationError

from app.schemas.member_schema import MemberCreate, MemberUpdate


class MemberSchemaTests(unittest.TestCase):
    def test_new_member_requires_attendance_demographics(self):
        with self.assertRaises(ValidationError) as context:
            MemberCreate(first_name="Ana", last_name="López")

        missing_fields = {error["loc"][0] for error in context.exception.errors()}
        self.assertTrue({"birth_date", "gender"}.issubset(missing_fields))

    def test_gender_aliases_are_normalized(self):
        member = MemberCreate(
            first_name="Ana",
            last_name="López",
            birth_date=date(1990, 1, 2),
            gender="F",
        )

        self.assertEqual(member.gender, "Femenino")
        self.assertEqual(MemberUpdate(gender="hombre").gender, "Masculino")

    def test_unknown_gender_is_rejected(self):
        with self.assertRaises(ValidationError):
            MemberUpdate(gender="sin registrar")


if __name__ == "__main__":
    unittest.main()
