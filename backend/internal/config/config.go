package config

import (
	"fmt"
	"lapangan/internal/models"
	"net"
	"net/url"
	"os"
	"strings"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// resolveToIP resolves a hostname to an IPv4 address.
// This is used to force IPv4 connection because Hugging Face Spaces / Docker
// often fail to route IPv6 traffic to external services (like Supabase),
// resulting in "network is unreachable" errors.
func resolveToIP(host string) string {
	// If it's already an IP, return as is
	if net.ParseIP(host) != nil {
		return host
	}

	ips, err := net.LookupIP(host)
	if err != nil {
		fmt.Printf("Warning: Failed to resolve host %s: %v\n", host, err)
		return host
	}

	// Prioritize IPv4
	for _, ip := range ips {
		if ip.To4() != nil {
			fmt.Printf("Resolved %s to IPv4: %s\n", host, ip.String())
			return ip.String()
		}
	}

	return host
}

func ConnectDB() {
	dbType := os.Getenv("DB_TYPE")
	var err error

	if dbType == "postgres" {
		var dsn string
		if dbUrl := os.Getenv("DATABASE_URL"); dbUrl != "" {
			// Parse the URL to replace hostname with IPv4
			// This handles both postgres://... URIs and key=value DSNs (partially)
			// But for simplicity, we assume standard Supabase connection string format or DSN

			// Try to parse as URL first
			u, err := url.Parse(dbUrl)
			if err == nil && u.Host != "" {
				host, port, _ := net.SplitHostPort(u.Host)
				if host == "" {
					host = u.Host
				}
				ipv4 := resolveToIP(host)
				if port != "" {
					u.Host = ipv4 + ":" + port
				} else {
					u.Host = ipv4
				}
				dsn = u.String()
			} else {
				// Fallback for key=value string (simple replace)
				// Note: This is a bit brittle but works for standard cases
				dsn = dbUrl
				// If DSN contains host=...
				if strings.Contains(dsn, "host=") {
					parts := strings.Split(dsn, " ")
					for i, part := range parts {
						if strings.HasPrefix(part, "host=") {
							host := strings.TrimPrefix(part, "host=")
							ipv4 := resolveToIP(host)
							parts[i] = "host=" + ipv4
						}
					}
					dsn = strings.Join(parts, " ")
				}
			}

			// Fix for Supabase: Ensure sslmode=require is present if not already
			if !strings.Contains(dsn, "sslmode=") {
				if strings.Contains(dsn, "?") {
					dsn += "&sslmode=require"
				} else {
					dsn += "?sslmode=require"
				}
			}
		} else {
			host := os.Getenv("DB_HOST")
			ipv4 := resolveToIP(host)
			
			dsn = fmt.Sprintf(
				"host=%s user=%s password=%s dbname=%s port=%s sslmode=require TimeZone=Asia/Jakarta",
				ipv4,
				os.Getenv("DB_USER"),
				os.Getenv("DB_PASSWORD"),
				os.Getenv("DB_NAME"),
				os.Getenv("DB_PORT"),
			)
		}
		fmt.Println("Connecting to Postgres...")
		// Print sanitized DSN for debugging (hide password)
		// fmt.Println("DSN:", strings.ReplaceAll(dsn, os.Getenv("DB_PASSWORD"), "*****"))
		
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	} else {
		// Default to SQLite
		fmt.Println("Using SQLite database...")
		// Ensure directory exists or use a temp path if permission denied in /app
		DB, err = gorm.Open(sqlite.Open("lapangan.db"), &gorm.Config{})
	}

	if err != nil {
		fmt.Printf("Error connecting to database: %v\n", err)
		panic("Failed to connect to database!")
	}

	fmt.Println("Database connected!")
	MigrateDB()
}

func MigrateDB() {
	err := DB.AutoMigrate(&models.User{}, &models.Field{}, &models.Booking{}, &models.Payment{})
	if err != nil {
		fmt.Printf("Error migrating database: %v\n", err)
	} else {
		fmt.Println("Database migrated!")
	}
}
