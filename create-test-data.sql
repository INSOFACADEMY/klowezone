-- Insert test data directly into database
-- This bypasses RLS policies for testing

-- Clear existing data
DELETE FROM project_activities;
DELETE FROM project_documents;
DELETE FROM projects;
DELETE FROM clientes;

-- Insert test clients
INSERT INTO clientes (id, user_id, nombre, email, telefono, estado, notas, created_at, updated_at) VALUES
('client-1', '550e8400-e29b-41d4-a716-446655440000', 'María González', 'maria@example.com', '+525512345678', 'Activo', 'Cliente de prueba 1', NOW(), NOW()),
('client-2', '550e8400-e29b-41d4-a716-446655440000', 'Carlos Rodríguez', 'carlos@example.com', '+525512345679', 'Activo', 'Cliente de prueba 2', NOW(), NOW()),
('client-3', '550e8400-e29b-41d4-a716-446655440000', 'Ana López', 'ana@example.com', '+525512345680', 'Pendiente', 'Cliente de prueba 3', NOW(), NOW()),
('client-4', '550e8400-e29b-41d4-a716-446655440000', 'Pedro Sánchez', 'na@klowezone.com', '0000000000', 'Activo', 'Cliente sin teléfono', NOW(), NOW());

-- Insert test projects
INSERT INTO projects (id, user_id, cliente_id, nombre_proyecto, descripcion, estado, prioridad, presupuesto, fecha_entrega, created_at, updated_at) VALUES
('project-1', '550e8400-e29b-41d4-a716-446655440000', 'client-1', 'Rediseño Web Corporativo', 'Rediseño completo del sitio web corporativo', 'EN_PROGRESO', 'ALTA', 85000, '2025-03-15', NOW(), NOW()),
('project-2', '550e8400-e29b-41d4-a716-446655440000', 'client-2', 'Aplicación Móvil E-commerce', 'Desarrollo de app móvil nativa', 'PLANIFICACION', 'URGENTE', 120000, '2025-05-01', NOW(), NOW()),
('project-3', '550e8400-e29b-41d4-a716-446655440000', 'client-3', 'Sistema de Gestión Empresarial', 'Implementación de ERP personalizado', 'COMPLETADO', 'MEDIA', 200000, '2024-12-01', NOW(), NOW());

-- Insert project activities
INSERT INTO project_activities (id, project_id, tipo, titulo, descripcion, created_at) VALUES
('activity-1', 'project-1', 'TASK_UPDATE', 'Revisión inicial completada', 'Se realizó la auditoría completa del sitio web actual', NOW()),
('activity-2', 'project-1', 'TASK_UPDATE', 'Wireframes aprobados', 'Los wireframes han sido aprobados por el cliente', NOW()),
('activity-3', 'project-3', 'TASK_UPDATE', 'Implementación finalizada', 'El sistema ERP está en producción', NOW());












