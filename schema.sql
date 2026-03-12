-- G6Labs Database Schema
-- Run this SQL on your Aiven MySQL database

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- Supplemental Learning Hub Schema
-- =====================================================

-- Resource types lookup table
CREATE TABLE IF NOT EXISTS resource_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed resource types
INSERT INTO resource_types (name, icon, description) VALUES
    ('website', 'globe', 'External websites and web applications'),
    ('article', 'file-text', 'Written articles and papers'),
    ('blog', 'edit', 'Blog posts and personal writings'),
    ('textbook', 'book', 'Textbooks and academic publications'),
    ('video', 'play-circle', 'Video tutorials and lectures'),
    ('course', 'graduation-cap', 'Online courses and curricula'),
    ('tool', 'tool', 'Interactive tools and calculators'),
    ('podcast', 'headphones', 'Audio content and podcasts'),
    ('paper', 'file', 'Research papers and academic journals')
ON DUPLICATE KEY UPDATE name = name;

-- Tags for categorizing resources (learning approach)
CREATE TABLE IF NOT EXISTS resource_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6366f1',
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed learning approach tags
INSERT INTO resource_tags (name, slug, color) VALUES
    ('Visual Learning', 'visual-learning', '#3b82f6'),
    ('Practice', 'practice', '#10b981'),
    ('Theory', 'theory', '#8b5cf6'),
    ('Intuition', 'intuition', '#f59e0b'),
    ('Applications', 'applications', '#ec4899'),
    ('Interactive', 'interactive', '#06b6d4'),
    ('Lecture', 'lecture', '#64748b'),
    ('Quick Reference', 'quick-reference', '#ef4444')
ON DUPLICATE KEY UPDATE name = name;

-- Main resources table
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    type_id INT NOT NULL,
    skill_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
    author VARCHAR(255) DEFAULT NULL,
    source_name VARCHAR(255) DEFAULT NULL,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    is_free BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES resource_types(id),
    INDEX idx_skill_level (skill_level),
    INDEX idx_type (type_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_featured (is_featured),
    FULLTEXT INDEX idx_search (title, description, author, source_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table for resources and tags (many-to-many)
CREATE TABLE IF NOT EXISTS resource_tag_map (
    resource_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (resource_id, tag_id),
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES resource_tags(id) ON DELETE CASCADE,
    INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
