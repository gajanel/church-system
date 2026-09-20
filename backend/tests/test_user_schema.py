import unittest

from pydantic import ValidationError

from app.schemas.user_schema import UserCreate, UserUpdate


class UserSchemaTests(unittest.TestCase):
    def valid_user(self, **overrides):
        data = {
            "name": "Ana López",
            "username": "Ana.Admin",
            "email": "ANA@example.com",
            "password": "Temporal1!",
            "modules": ["members"],
        }
        data.update(overrides)
        return UserCreate(**data)

    def test_normalizes_username_and_email(self):
        user = self.valid_user()
        self.assertEqual(user.username, "ana.admin")
        self.assertEqual(user.email, "ana@example.com")

    def test_temporary_password_uses_security_policy(self):
        with self.assertRaises(ValidationError):
            self.valid_user(password="debil")

    def test_super_admin_always_has_admin_role_and_no_module_list(self):
        user = self.valid_user(is_super_admin=True, is_admin=False)
        self.assertTrue(user.is_admin)
        self.assertEqual(user.modules, [])

    def test_empty_password_is_ignored_only_during_update(self):
        self.assertIsNone(UserUpdate(password="").password)


if __name__ == "__main__":
    unittest.main()
