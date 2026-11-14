CREATE TABLE IF NOT EXISTS Inventory
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material VARCHAR(50) UNIQUE,
    mass INT
);

CREATE TABLE IF NOT EXISTS Dictionary
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phrases VARCHAR(50) UNIQUE,
    translations VARCHAR(50)
);

INSERT OR IGNORE INTO Inventory (material, mass) VALUES ('Astrophage', 1000);
INSERT OR IGNORE INTO Inventory (material, mass) VALUES ('Xenonite', 200);

INSERT OR IGNORE INTO Dictionary (phrases, translations) VALUES ('amaze', 'Amaze!');
INSERT OR IGNORE INTO Dictionary (phrases, translations) VALUES ('fist', 'Fist my bump');
INSERT OR IGNORE INTO Dictionary (phrases, translations) VALUES ('good', 'Good good good');
INSERT OR IGNORE INTO Dictionary (phrases, translations) VALUES ('bad', 'Bad bad bad');
INSERT OR IGNORE INTO Dictionary (phrases, translations) VALUES ('question', 'Question?');
INSERT OR IGNORE INTO Dictionary (phrases, translations) VALUES ('fuel', 'Astrophage levels normal');
