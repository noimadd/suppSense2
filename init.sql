CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (user_type IN ('admin', 'user')),
    pfp_url VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    paper_url VARCHAR(255),
    recommended_dosage VARCHAR(255),
    maximum_dosage VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- links products and ingredients, the swap from JSONB so that ingredients can be linked and properly displayed
CREATE TABLE IF NOT EXISTS ProductIngredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    ingredient_id uuid NOT NULL REFERENCES Ingredients(id) ON DELETE CASCADE,
    amount VARCHAR(50),
    UNIQUE (product_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS LibraryData (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    library_name VARCHAR(255) NOT NULL,
    product_ids JSONB, -- cannot directly verify existance with jsonb gotta figure out a way to link properly mhm
    image_url VARCHAR(255),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default inserts for testing

-- 10 fake ingredients
INSERT INTO Ingredients (name, description, paper_url, recommended_dosage, maximum_dosage, verified, image_url)
VALUES
    ('Creatine Monohydrate', 'Improves strength and power output', 'https://example.com/papers/creatine', '5g', '20g', TRUE, 'https://example.com/img/creatine.png'),
    ('Caffeine Anhydrous', 'Central nervous system stimulant', 'https://example.com/papers/caffeine', '200mg', '400mg', TRUE, 'https://example.com/img/caffeine.png'),
    ('Beta-Alanine', 'Buffers muscular acidity during exercise', 'https://example.com/papers/beta-alanine', '3.2g', '6.4g', TRUE, 'https://example.com/img/beta-alanine.png'),
    ('L-Citrulline Malate', 'Increases nitric oxide production', 'https://example.com/papers/citrulline', '6g', '8g', TRUE, 'https://example.com/img/citrulline.png'),
    ('Betaine Anhydrous', 'Supports power output and cell hydration', 'https://example.com/papers/betaine', '2.5g', '5g', FALSE, 'https://example.com/img/betaine.png'),
    ('L-Tyrosine', 'Precursor to dopamine and norepinephrine', 'https://example.com/papers/tyrosine', '500mg', '2g', FALSE, 'https://example.com/img/tyrosine.png'),
    ('Taurine', 'Amino acid with antioxidant properties', 'https://example.com/papers/taurine', '1g', '3g', FALSE, 'https://example.com/img/taurine.png'),
    ('Alpha-GPC', 'Choline source for cognitive support', 'https://example.com/papers/alpha-gpc', '300mg', '600mg', FALSE, 'https://example.com/img/alpha-gpc.png'),
    ('Huperzine A', 'Acetylcholinesterase inhibitor', 'https://example.com/papers/huperzine', '100mcg', '400mcg', FALSE, 'https://example.com/img/huperzine.png'),
    ('Theobromine', 'Mild stimulant found in cacao', 'https://example.com/papers/theobromine', '50mg', '250mg', FALSE, 'https://example.com/img/theobromine.png');

-- fake product with barcode '1'
INSERT INTO Products (barcode, name, description)
VALUES (
    '1',
    'Test Pre-Workout Formula',
    'Fake product for local testing purposes'
);

INSERT INTO ProductIngredients (product_id, ingredient_id, amount)
SELECT p.id, i.id, v.amount
FROM (
    VALUES
        ('Creatine Monohydrate', '5g'),
        ('Caffeine Anhydrous', '300mg'),
        ('Beta-Alanine', '3.2g'),
        ('L-Citrulline Malate', '6g'),
        ('Betaine Anhydrous', '2.5g'),
        ('L-Tyrosine', '1g'),
        ('Taurine', '1g'),
        ('Alpha-GPC', '300mg'),
        ('Huperzine A', '200mcg'),
        ('Theobromine', '100mg')
) AS v(ingredient_name, amount)
JOIN Ingredients i ON i.name = v.ingredient_name
JOIN Products p ON p.barcode = '1';