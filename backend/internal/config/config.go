package config

import (
	"fmt"
	"lapangan/internal/models"
	"net"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// resolveToIP resolves a hostname to an IPv4 address.
func resolveToIP(host string) string {
	if net.ParseIP(host) != nil {
		return host
	}

	ips, err := net.LookupIP(host)
	if err != nil {
		fmt.Printf("Warning: Failed to resolve host %s: %v\n", host, err)
		return host
	}

	for _, ip := range ips {
		if ip.To4() != nil {
			fmt.Printf("Resolved %s to IPv4: %s\n", host, ip.String())
			return ip.String()
		}
	}
	return host
}

// forceIPv4InDSN attempts to replace hostname with IPv4 in the connection string.
// It handles both DSN format (host=...) and URI format (postgres://...)
func forceIPv4InDSN(dsn string) string {
	// Strategy 1: Look for standard Supabase hostname pattern
	// This is the most reliable way for Supabase specifically
	reSupabase := regexp.MustCompile(`([a-z0-9-]+\.supabase\.co)`)
	matches := reSupabase.FindStringSubmatch(dsn)
	if len(matches) > 1 {
		host := matches[1]
		ipv4 := resolveToIP(host)
		if ipv4 != host {
			fmt.Println("Replacing Supabase hostname with IP...")
			return strings.Replace(dsn, host, ipv4, 1)
		}
	}

	// Strategy 2: Look for host= parameter (DSN format)
	if strings.Contains(dsn, "host=") {
		reHost := regexp.MustCompile(`host=([^ ]+)`)
		matches := reHost.FindStringSubmatch(dsn)
		if len(matches) > 1 {
			host := matches[1]
			ipv4 := resolveToIP(host)
			if ipv4 != host {
				fmt.Println("Replacing DSN host= value with IP...")
				return strings.Replace(dsn, "host="+host, "host="+ipv4, 1)
			}
		}
	}

	// Strategy 3: Try URL parsing (URI format)
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		u, err := url.Parse(dsn)
		if err == nil {
			host := u.Hostname()
			ipv4 := resolveToIP(host)
			if ipv4 != host {
				fmt.Println("Replacing URI hostname with IP...")
				// We replace directly in string to avoid encoding issues with password
				return strings.Replace(dsn, host, ipv4, 1)
			}
		}
	}

	return dsn
}

func ConnectDB() {
	dbType := os.Getenv("DB_TYPE")
	var err error

	if dbType == "postgres" {
		var dsn string
		// 1. Get the raw DSN from Env
		rawDSN := os.Getenv("DATABASE_URL")
		
		if rawDSN != "" {
			dsn = rawDSN
		} else {
			// Construct from components if DATABASE_URL is missing
			dsn = fmt.Sprintf(
				"host=%s user=%s password=%s dbname=%s port=%s sslmode=require TimeZone=Asia/Jakarta",
				os.Getenv("DB_HOST"),
				os.Getenv("DB_USER"),
				os.Getenv("DB_PASSWORD"),
				os.Getenv("DB_NAME"),
				os.Getenv("DB_PORT"),
			)
		}

		// 2. Force IPv4 resolution
		fmt.Println("Processing connection string for IPv4...")
		dsn = forceIPv4InDSN(dsn)

		// 3. Ensure SSL Mode
		if !strings.Contains(dsn, "sslmode=") {
			if strings.Contains(dsn, "?") {
				dsn += "&sslmode=require"
			} else {
				dsn += "?sslmode=require" // For URI
				if !strings.Contains(dsn, "postgres://") && !strings.Contains(dsn, "postgresql://") {
					dsn += " sslmode=require" // For DSN (fallback)
				}
			}
		}

		fmt.Println("Connecting to Postgres...")
		// Debug: Print simplified DSN (first 10 chars) to verify structure
		if len(dsn) > 20 {
			fmt.Printf("DSN Start: %s...\n", dsn[:20])
		}

		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	} else {
		// Default to SQLite
		fmt.Println("Using SQLite database...")
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
