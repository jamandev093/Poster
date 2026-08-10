CREATE TEMP TABLE poster_brain_taxonomy_seed (
    slug text PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    parent_slug text,
    sort_order integer NOT NULL
) ON COMMIT DROP;

INSERT INTO poster_brain_taxonomy_seed (
    slug,
    name,
    description,
    parent_slug,
    sort_order
)
VALUES
-- ============================================================
-- MAJOR PARENT DOMAINS
-- ============================================================
('mathematics', 'Mathematics',
 'Mathematical theory, methods and applications.',
 NULL, 100),

('physics', 'Physics',
 'Matter, energy, forces and physical systems.',
 NULL, 200),

('computer-science', 'Computer Science',
 'Computation, algorithms, software and computing systems.',
 NULL, 300),

('space-astronomy', 'Space & Astronomy',
 'Astronomy, planetary science and space exploration.',
 NULL, 400),

('chemistry', 'Chemistry',
 'Matter, chemical structure, reactions and materials.',
 NULL, 500),

('biology', 'Biology',
 'Living systems, organisms, evolution and ecosystems.',
 NULL, 600),

('earth-environmental-science', 'Earth & Environmental Science',
 'Earth systems, climate, oceans, geology and environment.',
 NULL, 700),

('medicine-health', 'Medicine & Health',
 'Medicine, health science, public health and clinical research.',
 NULL, 800),

('engineering', 'Engineering',
 'Engineering disciplines, systems, design and applied science.',
 NULL, 900),

('technology', 'Technology',
 'Technology, digital infrastructure and applied innovation.',
 NULL, 1000),

('economics', 'Economics',
 'Economic systems, markets, policy and quantitative economics.',
 NULL, 1100),

('business', 'Business',
 'Companies, management, finance and entrepreneurship.',
 NULL, 1200),

('history', 'History',
 'Human history across periods, regions and themes.',
 NULL, 1300),

('geography', 'Geography',
 'Places, landscapes, populations and spatial systems.',
 NULL, 1400),

('politics-government', 'Politics & Government',
 'Government, public policy, elections and international relations.',
 NULL, 1500),

('law', 'Law',
 'Legal systems, rights, regulation and jurisprudence.',
 NULL, 1600),

('psychology', 'Psychology',
 'Mind, cognition, behavior and psychological science.',
 NULL, 1700),

('sociology', 'Sociology',
 'Society, institutions, populations and social change.',
 NULL, 1800),

('philosophy', 'Philosophy',
 'Reasoning, knowledge, ethics and fundamental questions.',
 NULL, 1900),

('education', 'Education',
 'Learning, teaching, institutions and education policy.',
 NULL, 2000),

('literature', 'Literature',
 'Literature, writing, criticism and publishing.',
 NULL, 2100),

('arts-culture', 'Arts & Culture',
 'Visual arts, music, film, theatre, design and heritage.',
 NULL, 2200),

('media-communication', 'Media & Communication',
 'Journalism, media systems and communication.',
 NULL, 2300),

('agriculture-food-science', 'Agriculture & Food Science',
 'Agriculture, food systems and related applied sciences.',
 NULL, 2400),

('anthropology-archaeology', 'Anthropology & Archaeology',
 'Human cultures, archaeology and human origins.',
 NULL, 2500),

('language-linguistics', 'Language & Linguistics',
 'Language structure, use, evolution and computational linguistics.',
 NULL, 2600),

-- ============================================================
-- MATHEMATICS
-- ============================================================
('algebra', 'Algebra',
 'Algebraic structures and symbolic mathematics.',
 'mathematics', 101),

('geometry', 'Geometry',
 'Geometry and spatial mathematical structures.',
 'mathematics', 102),

('number-theory', 'Number Theory',
 'Properties and relationships of numbers.',
 'mathematics', 103),

('probability', 'Probability',
 'Probability theory and stochastic systems.',
 'mathematics', 104),

('statistics', 'Statistics',
 'Statistical theory, inference and data analysis.',
 'mathematics', 105),

('mathematical-analysis', 'Mathematical Analysis',
 'Real, complex and functional analysis.',
 'mathematics', 106),

('applied-mathematics', 'Applied Mathematics',
 'Mathematical methods applied to real systems.',
 'mathematics', 107),

('discrete-mathematics', 'Discrete Mathematics',
 'Discrete structures, combinatorics and graph theory.',
 'mathematics', 108),

-- ============================================================
-- PHYSICS
-- ============================================================
('classical-mechanics', 'Classical Mechanics',
 'Motion and forces in classical physical systems.',
 'physics', 201),

('quantum-mechanics', 'Quantum Mechanics',
 'Quantum states, interactions and measurement.',
 'physics', 202),

('relativity', 'Relativity',
 'Special and general relativity.',
 'physics', 203),

('particle-physics', 'Particle Physics',
 'Fundamental particles and interactions.',
 'physics', 204),

('nuclear-physics', 'Nuclear Physics',
 'Atomic nuclei and nuclear processes.',
 'physics', 205),

('condensed-matter-physics', 'Condensed Matter Physics',
 'Physical properties of condensed systems.',
 'physics', 206),

('optics-photonics', 'Optics & Photonics',
 'Light, optics and photonic systems.',
 'physics', 207),

('thermodynamics', 'Thermodynamics',
 'Heat, energy and statistical physical systems.',
 'physics', 208),

-- ============================================================
-- COMPUTER SCIENCE
-- ============================================================
('ai', 'Artificial Intelligence',
 'Artificial intelligence and intelligent computational systems.',
 'computer-science', 301),

('machine-learning', 'Machine Learning',
 'Learning algorithms and statistical machine intelligence.',
 'computer-science', 302),

('algorithms', 'Algorithms',
 'Algorithm design, analysis and computational methods.',
 'computer-science', 303),

('software-engineering', 'Software Engineering',
 'Software architecture, development and reliability.',
 'computer-science', 304),

('computer-systems', 'Computer Systems',
 'Operating systems, architecture and distributed systems.',
 'computer-science', 305),

('databases', 'Databases',
 'Database systems, storage and information management.',
 'computer-science', 306),

('cybersecurity', 'Cybersecurity',
 'Computer security, privacy and resilient systems.',
 'computer-science', 307),

('human-computer-interaction', 'Human-Computer Interaction',
 'Human interaction with computing systems.',
 'computer-science', 308),

('computer-graphics', 'Computer Graphics',
 'Computer graphics, rendering and visualization.',
 'computer-science', 309),

-- ============================================================
-- SPACE & ASTRONOMY
-- ============================================================
('astronomy', 'Astronomy',
 'Observation and study of celestial objects.',
 'space-astronomy', 401),

('astrophysics', 'Astrophysics',
 'Physical processes governing astronomical systems.',
 'space-astronomy', 402),

('cosmology', 'Cosmology',
 'Origin, structure and evolution of the universe.',
 'space-astronomy', 403),

('planetary-science', 'Planetary Science',
 'Planets, moons and planetary systems.',
 'space-astronomy', 404),

('space-exploration', 'Space Exploration',
 'Robotic and human exploration beyond Earth.',
 'space-astronomy', 405),

('solar-system', 'Solar System',
 'The Sun, planets, moons and small bodies.',
 'space-astronomy', 406),

('exoplanets', 'Exoplanets',
 'Planets orbiting stars beyond the Solar System.',
 'space-astronomy', 407),

('space-missions', 'Space Missions',
 'Scientific and exploratory space missions.',
 'space-astronomy', 408),

-- ============================================================
-- CHEMISTRY
-- ============================================================
('organic-chemistry', 'Organic Chemistry',
 'Carbon compounds and organic reactions.',
 'chemistry', 501),

('inorganic-chemistry', 'Inorganic Chemistry',
 'Inorganic compounds and materials.',
 'chemistry', 502),

('physical-chemistry', 'Physical Chemistry',
 'Physical principles governing chemical systems.',
 'chemistry', 503),

('analytical-chemistry', 'Analytical Chemistry',
 'Chemical measurement and analytical methods.',
 'chemistry', 504),

('biochemistry', 'Biochemistry',
 'Chemical processes in biological systems.',
 'chemistry', 505),

('materials-chemistry', 'Materials Chemistry',
 'Chemical design and properties of materials.',
 'chemistry', 506),

-- ============================================================
-- BIOLOGY
-- ============================================================
('genetics', 'Genetics',
 'Genes, inheritance and genomic systems.',
 'biology', 601),

('evolution', 'Evolution',
 'Evolutionary processes and biological diversity.',
 'biology', 602),

('ecology', 'Ecology',
 'Organisms, ecosystems and ecological relationships.',
 'biology', 603),

('zoology', 'Zoology',
 'Animals and animal biology.',
 'biology', 604),

('botany', 'Botany',
 'Plants and plant biology.',
 'biology', 605),

('microbiology', 'Microbiology',
 'Microorganisms and microbial systems.',
 'biology', 606),

('molecular-biology', 'Molecular Biology',
 'Molecular processes of living systems.',
 'biology', 607),

('neuroscience', 'Neuroscience',
 'Nervous systems, brain science and neural function.',
 'biology', 608),

-- ============================================================
-- EARTH & ENVIRONMENT
-- ============================================================
('geology', 'Geology',
 'Earth materials, structure and geological history.',
 'earth-environmental-science', 701),

('meteorology', 'Meteorology',
 'Atmosphere and weather systems.',
 'earth-environmental-science', 702),

('climate-science', 'Climate Science',
 'Climate systems, variability and climate change.',
 'earth-environmental-science', 703),

('oceanography', 'Oceanography',
 'Ocean systems and marine physical science.',
 'earth-environmental-science', 704),

('hydrology', 'Hydrology',
 'Water cycles and freshwater systems.',
 'earth-environmental-science', 705),

('environmental-science', 'Environmental Science',
 'Environmental systems and human-environment interactions.',
 'earth-environmental-science', 706),

('natural-hazards', 'Natural Hazards',
 'Earth hazards and extreme natural events.',
 'earth-environmental-science', 707),

-- ============================================================
-- MEDICINE & HEALTH
-- ============================================================
('clinical-medicine', 'Clinical Medicine',
 'Diagnosis, treatment and clinical practice.',
 'medicine-health', 801),

('public-health', 'Public Health',
 'Population health and prevention.',
 'medicine-health', 802),

('epidemiology', 'Epidemiology',
 'Distribution and determinants of health conditions.',
 'medicine-health', 803),

('pharmacology', 'Pharmacology',
 'Drugs, medicines and biological effects.',
 'medicine-health', 804),

('nutrition', 'Nutrition',
 'Nutrition science, diet and human health.',
 'medicine-health', 805),

('mental-health', 'Mental Health',
 'Mental health science, care and wellbeing.',
 'medicine-health', 806),

('medical-research', 'Medical Research',
 'Biomedical and translational medical research.',
 'medicine-health', 807),

-- ============================================================
-- ENGINEERING
-- ============================================================
('mechanical-engineering', 'Mechanical Engineering',
 'Mechanical systems, machines and design.',
 'engineering', 901),

('electrical-engineering', 'Electrical Engineering',
 'Electrical, electronic and power systems.',
 'engineering', 902),

('civil-engineering', 'Civil Engineering',
 'Infrastructure and built-environment engineering.',
 'engineering', 903),

('chemical-engineering', 'Chemical Engineering',
 'Industrial chemical processes and systems.',
 'engineering', 904),

('aerospace-engineering', 'Aerospace Engineering',
 'Aircraft, spacecraft and aerospace systems.',
 'engineering', 905),

('biomedical-engineering', 'Biomedical Engineering',
 'Engineering applied to medicine and biology.',
 'engineering', 906),

('robotics', 'Robotics',
 'Robotic machines, control and autonomous systems.',
 'engineering', 907),

('energy-engineering', 'Energy Engineering',
 'Energy generation, conversion and infrastructure.',
 'engineering', 908),

-- ============================================================
-- TECHNOLOGY
-- ============================================================
('cloud-computing', 'Cloud Computing',
 'Cloud infrastructure and distributed services.',
 'technology', 1001),

('semiconductors', 'Semiconductors',
 'Semiconductor technology and chip ecosystems.',
 'technology', 1002),

('telecommunications', 'Telecommunications',
 'Communication networks and telecom infrastructure.',
 'technology', 1003),

('consumer-technology', 'Consumer Technology',
 'Technology products and consumer devices.',
 'technology', 1004),

('digital-platforms', 'Digital Platforms',
 'Online platforms, ecosystems and infrastructure.',
 'technology', 1005),

('emerging-technology', 'Emerging Technology',
 'New and rapidly developing technologies.',
 'technology', 1006),

-- ============================================================
-- ECONOMICS
-- ============================================================
('macroeconomics', 'Macroeconomics',
 'Economies at national and global scale.',
 'economics', 1101),

('microeconomics', 'Microeconomics',
 'Individual, firm and market economic behavior.',
 'economics', 1102),

('development-economics', 'Development Economics',
 'Economic development and growth.',
 'economics', 1103),

('international-economics', 'International Economics',
 'Trade, international finance and global economics.',
 'economics', 1104),

('behavioral-economics', 'Behavioral Economics',
 'Behavioral foundations of economic decision making.',
 'economics', 1105),

('econometrics', 'Econometrics',
 'Statistical and quantitative economic analysis.',
 'economics', 1106),

-- ============================================================
-- BUSINESS
-- ============================================================
('finance', 'Finance',
 'Finance, capital and financial decision making.',
 'business', 1201),

('markets', 'Markets',
 'Markets, exchanges and market activity.',
 'business', 1202),

('entrepreneurship', 'Entrepreneurship',
 'Startups, founders and new ventures.',
 'business', 1203),

('management', 'Management',
 'Organizational and business management.',
 'business', 1204),

('marketing', 'Marketing',
 'Marketing, brands and customer strategy.',
 'business', 1205),

('accounting', 'Accounting',
 'Accounting, financial reporting and audit.',
 'business', 1206),

('corporate-strategy', 'Corporate Strategy',
 'Business strategy and corporate development.',
 'business', 1207),

-- ============================================================
-- HISTORY
-- ============================================================
('ancient-history', 'Ancient History',
 'Ancient societies and civilizations.',
 'history', 1301),

('medieval-history', 'Medieval History',
 'Medieval societies, cultures and institutions.',
 'history', 1302),

('modern-history', 'Modern History',
 'History of the modern era.',
 'history', 1303),

('world-history', 'World History',
 'Comparative and global historical developments.',
 'history', 1304),

('economic-history', 'Economic History',
 'Historical development of economies and markets.',
 'history', 1305),

('history-science-technology', 'History of Science & Technology',
 'Historical development of science and technology.',
 'history', 1306),

-- ============================================================
-- GEOGRAPHY
-- ============================================================
('physical-geography', 'Physical Geography',
 'Physical landscapes and geographic processes.',
 'geography', 1401),

('human-geography', 'Human Geography',
 'Human populations, settlements and spatial organization.',
 'geography', 1402),

('cartography-gis', 'Cartography & GIS',
 'Mapping and geographic information systems.',
 'geography', 1403),

('urban-geography', 'Urban Geography',
 'Cities, urban systems and spatial development.',
 'geography', 1404),

-- ============================================================
-- POLITICS & GOVERNMENT
-- ============================================================
('policy', 'Public Policy',
 'Public policy and government decision making.',
 'politics-government', 1501),

('international-relations', 'International Relations',
 'Relations among states and international institutions.',
 'politics-government', 1502),

('elections', 'Elections',
 'Elections, voting and electoral systems.',
 'politics-government', 1503),

('governance', 'Governance',
 'Government institutions and public administration.',
 'politics-government', 1504),

('geopolitics', 'Geopolitics',
 'Geographic and strategic dimensions of international politics.',
 'politics-government', 1505),

('political-economy', 'Political Economy',
 'Interactions between political and economic systems.',
 'politics-government', 1506),

-- ============================================================
-- LAW
-- ============================================================
('constitutional-law', 'Constitutional Law',
 'Constitutions and constitutional legal systems.',
 'law', 1601),

('international-law', 'International Law',
 'International legal rules and institutions.',
 'law', 1602),

('corporate-law', 'Corporate Law',
 'Law governing companies and corporate activity.',
 'law', 1603),

('criminal-law', 'Criminal Law',
 'Criminal law and justice systems.',
 'law', 1604),

('civil-law', 'Civil Law',
 'Civil legal rights, obligations and disputes.',
 'law', 1605),

('intellectual-property', 'Intellectual Property',
 'Copyright, patents, trademarks and related rights.',
 'law', 1606),

('technology-law', 'Technology Law',
 'Law and regulation of technology and digital systems.',
 'law', 1607),

-- ============================================================
-- PSYCHOLOGY
-- ============================================================
('cognitive-psychology', 'Cognitive Psychology',
 'Cognition, perception and mental processes.',
 'psychology', 1701),

('developmental-psychology', 'Developmental Psychology',
 'Psychological development across the lifespan.',
 'psychology', 1702),

('social-psychology', 'Social Psychology',
 'Social influence and interpersonal behavior.',
 'psychology', 1703),

('behavioral-science', 'Behavioral Science',
 'Scientific study of behavior and decision making.',
 'psychology', 1704),

('clinical-psychology', 'Clinical Psychology',
 'Psychological assessment and clinical practice.',
 'psychology', 1705),

-- ============================================================
-- SOCIOLOGY
-- ============================================================
('social-inequality', 'Social Inequality',
 'Inequality, stratification and social structure.',
 'sociology', 1801),

('culture-society', 'Culture & Society',
 'Culture, identity and social life.',
 'sociology', 1802),

('urban-sociology', 'Urban Sociology',
 'Social organization and life in cities.',
 'sociology', 1803),

('population-demography', 'Population & Demography',
 'Population structure and demographic change.',
 'sociology', 1804),

('organizations-society', 'Organizations & Society',
 'Organizations, institutions and social systems.',
 'sociology', 1805),

-- ============================================================
-- PHILOSOPHY
-- ============================================================
('ethics', 'Ethics',
 'Moral philosophy and ethical reasoning.',
 'philosophy', 1901),

('epistemology', 'Epistemology',
 'Knowledge, belief and justification.',
 'philosophy', 1902),

('logic', 'Logic',
 'Formal and philosophical reasoning.',
 'philosophy', 1903),

('metaphysics', 'Metaphysics',
 'Reality, existence and fundamental structure.',
 'philosophy', 1904),

('political-philosophy', 'Political Philosophy',
 'Philosophical study of politics and justice.',
 'philosophy', 1905),

('philosophy-science', 'Philosophy of Science',
 'Foundations and methods of scientific knowledge.',
 'philosophy', 1906),

-- ============================================================
-- EDUCATION
-- ============================================================
('learning-science', 'Learning Science',
 'Scientific study of learning and instruction.',
 'education', 2001),

('higher-education', 'Higher Education',
 'Universities and post-secondary education.',
 'education', 2002),

('school-education', 'School Education',
 'Primary and secondary education.',
 'education', 2003),

('education-policy', 'Education Policy',
 'Policy and governance in education.',
 'education', 2004),

('educational-technology', 'Educational Technology',
 'Technology supporting learning and teaching.',
 'education', 2005),

-- ============================================================
-- LITERATURE
-- ============================================================
('fiction', 'Fiction',
 'Fiction and narrative literature.',
 'literature', 2101),

('poetry', 'Poetry',
 'Poetry and poetic traditions.',
 'literature', 2102),

('literary-criticism', 'Literary Criticism',
 'Analysis and criticism of literature.',
 'literature', 2103),

('world-literature', 'World Literature',
 'Literary traditions across languages and regions.',
 'literature', 2104),

('publishing', 'Publishing',
 'Books, publishing and literary industries.',
 'literature', 2105),

-- ============================================================
-- ARTS & CULTURE
-- ============================================================
('visual-arts', 'Visual Arts',
 'Painting, sculpture and visual artistic practice.',
 'arts-culture', 2201),

('music', 'Music',
 'Music, composition, performance and culture.',
 'arts-culture', 2202),

('film', 'Film',
 'Cinema, filmmaking and film culture.',
 'arts-culture', 2203),

('theatre', 'Theatre',
 'Theatre, drama and performance.',
 'arts-culture', 2204),

('architecture', 'Architecture',
 'Architecture and the designed built environment.',
 'arts-culture', 2205),

('design', 'Design',
 'Design disciplines and creative practice.',
 'arts-culture', 2206),

('museums-heritage', 'Museums & Heritage',
 'Museums, cultural heritage and preservation.',
 'arts-culture', 2207),

-- ============================================================
-- MEDIA & COMMUNICATION
-- ============================================================
('journalism', 'Journalism',
 'News gathering, reporting and journalism.',
 'media-communication', 2301),

('digital-media', 'Digital Media',
 'Digital publishing and online media.',
 'media-communication', 2302),

('communication-studies', 'Communication Studies',
 'Human and mass communication.',
 'media-communication', 2303),

('social-media', 'Social Media',
 'Social platforms and networked communication.',
 'media-communication', 2304),

('information-literacy', 'Information Literacy',
 'Evaluation and understanding of information and media.',
 'media-communication', 2305),

-- ============================================================
-- AGRICULTURE & FOOD SCIENCE
-- ============================================================
('agronomy', 'Agronomy',
 'Crop production and soil management.',
 'agriculture-food-science', 2401),

('food-science', 'Food Science',
 'Science of food, processing and safety.',
 'agriculture-food-science', 2402),

('sustainable-agriculture', 'Sustainable Agriculture',
 'Sustainable farming and food production systems.',
 'agriculture-food-science', 2403),

('animal-science', 'Animal Science',
 'Agricultural and domestic animal science.',
 'agriculture-food-science', 2404),

('fisheries', 'Fisheries',
 'Fisheries science and aquatic resource management.',
 'agriculture-food-science', 2405),

('forestry', 'Forestry',
 'Forests, forestry science and management.',
 'agriculture-food-science', 2406),

-- ============================================================
-- ANTHROPOLOGY & ARCHAEOLOGY
-- ============================================================
('cultural-anthropology', 'Cultural Anthropology',
 'Human cultures and cultural systems.',
 'anthropology-archaeology', 2501),

('archaeology', 'Archaeology',
 'Material evidence of past human societies.',
 'anthropology-archaeology', 2502),

('human-evolution', 'Human Evolution',
 'Biological and cultural evolution of humans.',
 'anthropology-archaeology', 2503),

-- ============================================================
-- LANGUAGE & LINGUISTICS
-- ============================================================
('linguistics', 'Linguistics',
 'Scientific study of language.',
 'language-linguistics', 2601),

('language-evolution', 'Language Evolution',
 'Origins and evolution of human language.',
 'language-linguistics', 2602),

('translation', 'Translation',
 'Translation theory, practice and technologies.',
 'language-linguistics', 2603),

('sociolinguistics', 'Sociolinguistics',
 'Relationships between language and society.',
 'language-linguistics', 2604),

('computational-linguistics', 'Computational Linguistics',
 'Computational methods for language.',
 'language-linguistics', 2605);

-- ============================================================
-- PRESERVE EXISTING UUIDS
--
-- If an existing topic already has the canonical name but an
-- older slug, canonicalize the slug rather than creating a
-- duplicate topic. This preserves user-interest foreign keys.
-- ============================================================

UPDATE app.taxonomy_topics AS topic
SET
    slug = seed.slug,
    status = 'active',
    archived_at = NULL,
    sort_order = seed.sort_order,
    description = COALESCE(
        NULLIF(BTRIM(topic.description), ''),
        seed.description
    )
FROM poster_brain_taxonomy_seed AS seed
WHERE
    LOWER(topic.name) = LOWER(seed.name)
    AND LOWER(topic.slug) <> LOWER(seed.slug)
    AND NOT EXISTS (
        SELECT 1
        FROM app.taxonomy_topics conflict
        WHERE
            LOWER(conflict.slug) = LOWER(seed.slug)
            AND conflict.id <> topic.id
    );

-- Insert missing root domains.
INSERT INTO app.taxonomy_topics (
    slug,
    name,
    description,
    parent_topic_id,
    status,
    sort_order,
    archived_at
)
SELECT
    seed.slug,
    seed.name,
    seed.description,
    NULL,
    'active',
    seed.sort_order,
    NULL
FROM poster_brain_taxonomy_seed seed
WHERE
    seed.parent_slug IS NULL
    AND NOT EXISTS (
        SELECT 1
        FROM app.taxonomy_topics existing
        WHERE LOWER(existing.slug) = LOWER(seed.slug)
    );

-- Reactivate/refine existing canonical roots without replacing IDs.
UPDATE app.taxonomy_topics topic
SET
    status = 'active',
    archived_at = NULL,
    parent_topic_id = NULL,
    sort_order = seed.sort_order,
    description = COALESCE(
        NULLIF(BTRIM(topic.description), ''),
        seed.description
    )
FROM poster_brain_taxonomy_seed seed
WHERE
    seed.parent_slug IS NULL
    AND LOWER(topic.slug) = LOWER(seed.slug);

-- Insert missing first-level stable children.
INSERT INTO app.taxonomy_topics (
    slug,
    name,
    description,
    parent_topic_id,
    status,
    sort_order,
    archived_at
)
SELECT
    seed.slug,
    seed.name,
    seed.description,
    parent.id,
    'active',
    seed.sort_order,
    NULL
FROM poster_brain_taxonomy_seed seed
INNER JOIN app.taxonomy_topics parent
    ON LOWER(parent.slug) = LOWER(seed.parent_slug)
WHERE
    seed.parent_slug IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM app.taxonomy_topics existing
        WHERE LOWER(existing.slug) = LOWER(seed.slug)
    );

-- Enforce the intended parent relationship for seeded stable children.
UPDATE app.taxonomy_topics child
SET
    parent_topic_id = parent.id,
    status = 'active',
    archived_at = NULL,
    sort_order = seed.sort_order,
    description = COALESCE(
        NULLIF(BTRIM(child.description), ''),
        seed.description
    )
FROM poster_brain_taxonomy_seed seed
INNER JOIN app.taxonomy_topics parent
    ON LOWER(parent.slug) = LOWER(seed.parent_slug)
WHERE
    seed.parent_slug IS NOT NULL
    AND LOWER(child.slug) = LOWER(seed.slug)
    AND child.id <> parent.id;

-- Fail migration if any canonical seed is missing or mis-parented.
DO $migration$
DECLARE
    missing_count integer;
    invalid_parent_count integer;
BEGIN
    SELECT COUNT(*)
    INTO missing_count
    FROM poster_brain_taxonomy_seed seed
    WHERE NOT EXISTS (
        SELECT 1
        FROM app.taxonomy_topics topic
        WHERE
            LOWER(topic.slug) = LOWER(seed.slug)
            AND topic.status = 'active'
    );

    IF missing_count <> 0 THEN
        RAISE EXCEPTION
            'Canonical Poster Brain taxonomy seed is incomplete: % missing topics.',
            missing_count;
    END IF;

    SELECT COUNT(*)
    INTO invalid_parent_count
    FROM poster_brain_taxonomy_seed seed
    INNER JOIN app.taxonomy_topics child
        ON LOWER(child.slug) = LOWER(seed.slug)
    INNER JOIN app.taxonomy_topics parent
        ON LOWER(parent.slug) = LOWER(seed.parent_slug)
    WHERE
        seed.parent_slug IS NOT NULL
        AND child.parent_topic_id IS DISTINCT FROM parent.id;

    IF invalid_parent_count <> 0 THEN
        RAISE EXCEPTION
            'Canonical Poster Brain taxonomy hierarchy is invalid: % child topics.',
            invalid_parent_count;
    END IF;
END;
$migration$;