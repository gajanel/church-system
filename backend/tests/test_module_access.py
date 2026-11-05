import unittest
from types import SimpleNamespace

from app.utils.access import has_module_access


class ModuleAccessTests(unittest.TestCase):
    def user(self, modules=None, admin=False):
        return SimpleNamespace(
            modules=modules or [],
            is_admin=admin,
            is_super_admin=False,
        )

    def test_child_permission_opens_parent_group_only(self):
        user = self.user(["finance.expenses"])
        self.assertTrue(has_module_access(user, "finance"))
        self.assertTrue(has_module_access(user, "finance.expenses"))
        self.assertFalse(has_module_access(user, "finance.incomes"))

    def test_unscoped_parent_grants_all_children(self):
        user = self.user(["reports"])
        self.assertTrue(has_module_access(user, "reports.attendance"))

    def test_admin_has_all_modules(self):
        self.assertTrue(has_module_access(self.user(admin=True), "settings"))


if __name__ == "__main__":
    unittest.main()
