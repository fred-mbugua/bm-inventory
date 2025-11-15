-- Assuming 'Admin' is the name of system administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Admin'), -- Finds the Admin Role ID
    p.id                                        -- Selects ALL Permission IDs
FROM 
    permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;