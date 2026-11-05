def has_module_access(current_user, module_id: str) -> bool:
    if current_user.is_admin or current_user.is_super_admin:
        return True
    modules = current_user.modules or []
    if module_id in modules:
        return True
    if "." not in module_id:
        return any(item.startswith(f"{module_id}.") for item in modules)
    parent = module_id.split(".", 1)[0]
    has_scoped_children = any(item.startswith(f"{parent}.") for item in modules)
    return parent in modules and not has_scoped_children
