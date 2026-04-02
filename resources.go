package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ======== Types ========

// ResourceType represents a resource type from the database
type ResourceType struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	Description string `json:"description,omitempty"`
}

// ResourceTag represents a resource tag from the database
type ResourceTag struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Slug  string `json:"slug"`
	Color string `json:"color"`
}

// Resource represents a row in the database in the resources table with the following attributes
type Resource struct {
	ID            int       `json:"id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Url           string    `json:"url"`
	Type_id       int       `json:"type_id"`
	Skill_level   string    `json:"skill_level"`
	Author        string    `json:"author"`
	Source_name   string    `json:"source_name"`
	Thumbnail_url string    `json:"thumbnail_url"`
	Is_free       bool      `json:"is_free"`
	Is_featured   bool      `json:"is_featured"`
	Is_active     bool      `json:"is_active"`
	View_count    int       `json:"view_count"`
	Created_at    time.Time `json:"created_at"`
	Updated_at    time.Time `json:"updated_at"`
}

// ======== DB Functions ========

// GetResourceTypes fetches all resource types from the database
func GetResourceTypes() ([]ResourceType, error) {
	rows, err := db.Query("SELECT id, name, COALESCE(icon, ''), COALESCE(description, '') FROM resource_types")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var types []ResourceType
	for rows.Next() {
		var t ResourceType
		if err := rows.Scan(&t.ID, &t.Name, &t.Icon, &t.Description); err != nil {
			return nil, err
		}
		types = append(types, t)
	}
	return types, rows.Err()
}

// GetResourceTags fetches all resource tags from the database
func GetResourceTags() ([]ResourceTag, error) {
	rows, err := db.Query("SELECT id, name, slug, color FROM resource_tags")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []ResourceTag
	for rows.Next() {
		var t ResourceTag
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.Color); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, rows.Err()
}

// GetResources fetches all of the resources in the database
func GetResources(skill string, types []int, tags []int) ([]Resource, error) {
	query := `
        SELECT DISTINCT r.id, r.title, COALESCE(r.description,''), r.url,
        r.type_id, r.skill_level, COALESCE(r.author,''),
        COALESCE(r.source_name,''), COALESCE(r.thumbnail_url,''),
        r.is_free, r.is_featured, r.is_active, r.view_count,
        r.created_at, r.updated_at
        FROM resources r
        LEFT JOIN resource_tag_map rtm ON r.id = rtm.resource_id
        WHERE r.is_active = TRUE
    `

	var args []interface{}

	// add skill level to query when selected
	if skill != "" {
		query += " AND r.skill_level = ?"
		args = append(args, skill)
	}

	// add types to query when selected
	if len(types) > 0 {
		placeholders := strings.Repeat("?,", len(types))
		placeholders = placeholders[:len(placeholders)-1] // remove trailing comma
		query += " AND r.type_id IN (" + placeholders + ")"

		for _, t := range types {
			args = append(args, t)
		}
	}

	// add tags to query when selected
	if len(tags) > 0 {
		placeholders := strings.Repeat("?,", len(tags))
		placeholders = placeholders[:len(placeholders)-1] // remove trailing comma
		query += " AND rtm.tag_id IN (" + placeholders + ")"

		for _, t := range tags {
			args = append(args, t)
		}
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resources []Resource
	for rows.Next() {
		var r Resource
		if err := rows.Scan(&r.ID, &r.Title, &r.Description, &r.Url,
			&r.Type_id, &r.Skill_level, &r.Author, &r.Source_name,
			&r.Thumbnail_url, &r.Is_free, &r.Is_featured, &r.Is_active,
			&r.View_count, &r.Created_at, &r.Updated_at); err != nil {
			return nil, err
		}
		resources = append(resources, r)
	}
	return resources, rows.Err()
}

// ======== HTTP Handlers ========
// handler for types filter
func handleGetResourceTypes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use GET"})
		return
	}

	types, err := GetResourceTypes()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, types)
}

// handler for tags filter (learning styles)
func handleGetResourceTags(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use GET"})
		return
	}

	tags, err := GetResourceTags()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, tags)
}

// handler to obtain the actual data from the database for grid display with filters selected
func handleGetResources(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use GET"})
		return
	}

	skill := r.URL.Query().Get("skill_level")

	var types []int
	if typesStr := r.URL.Query().Get("types"); typesStr != "" {
		for _, s := range strings.Split(typesStr, ",") {
			if id, err := strconv.Atoi(strings.TrimSpace(s)); err == nil {
				types = append(types, id)
			}
		}
	}

	var tags []int
	if tagsStr := r.URL.Query().Get("tags"); tagsStr != "" {
		for _, s := range strings.Split(tagsStr, ",") {
			if id, err := strconv.Atoi(strings.TrimSpace(s)); err == nil {
				tags = append(tags, id)
			}
		}
	}

	resources, err := GetResources(skill, types, tags)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resources)
}
