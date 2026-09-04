-- Small demo catalogue for local development and the prescription flow.
-- Each insert is guarded because the medicines table has no unique name constraint in the MVP schema.

INSERT INTO medicines (name, unit, description, active, created_at, updated_at)
SELECT 'Paracetamol', 'tablet', 'Pain relief and fever reduction', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE name = 'Paracetamol');

INSERT INTO medicines (name, unit, description, active, created_at, updated_at)
SELECT 'Ibuprofen', 'tablet', 'Non-steroidal anti-inflammatory medicine', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE name = 'Ibuprofen');

INSERT INTO medicines (name, unit, description, active, created_at, updated_at)
SELECT 'Amoxicillin', 'capsule', 'Antibiotic; use only when prescribed', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE name = 'Amoxicillin');

INSERT INTO medicines (name, unit, description, active, created_at, updated_at)
SELECT 'Vitamin C', 'tablet', 'Vitamin supplement', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE name = 'Vitamin C');
