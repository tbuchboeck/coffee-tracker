#!/bin/bash

# Script to update Lavazza Gran Crema Barista in Supabase database
# This script will find and update the coffee entry with detailed information

set -e

echo "🔍 Lavazza Gran Crema Barista - Database Update Script"
echo "======================================================"
echo ""

# Check if environment variables are set
if [ -z "$REACT_APP_SUPABASE_URL" ] || [ -z "$REACT_APP_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Supabase credentials not found in environment variables."
    echo ""
    echo "Please enter your Supabase credentials:"
    echo "(You can find these in your Supabase project settings)"
    echo ""

    read -p "Supabase URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_KEY

    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
        echo "❌ Error: Both URL and API key are required!"
        exit 1
    fi
else
    SUPABASE_URL="$REACT_APP_SUPABASE_URL"
    SUPABASE_KEY="$REACT_APP_SUPABASE_ANON_KEY"
    echo "✅ Using Supabase credentials from environment variables"
fi

echo ""
echo "📡 Connecting to Supabase..."
echo ""

# First, find the Lavazza Gran Crema entry
echo "🔍 Searching for Lavazza Gran Crema Barista..."

RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/coffees?select=*&roaster=ilike.*lavazza*&description=ilike.*gran*crema*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json")

# Check if we found any entries
COUNT=$(echo "$RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

if [ "$COUNT" -eq "0" ]; then
    echo ""
    echo "❌ Lavazza Gran Crema Barista not found in database!"
    echo ""
    echo "Please make sure you have added this coffee to your database first."
    echo "You can add it through your web app."
    echo ""

    # Show available Lavazza coffees
    echo "Looking for other Lavazza coffees in database..."
    LAVAZZA_RESPONSE=$(curl -s -X GET \
      "${SUPABASE_URL}/rest/v1/coffees?select=id,roaster,description&roaster=ilike.*lavazza*" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: application/json")

    LAVAZZA_COUNT=$(echo "$LAVAZZA_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

    if [ "$LAVAZZA_COUNT" -gt "0" ]; then
        echo ""
        echo "Found Lavazza coffees:"
        echo "$LAVAZZA_RESPONSE" | jq -r '.[] | "  - ID \(.id): \(.roaster) - \(.description)"'
    else
        echo "No Lavazza coffees found."
    fi

    exit 1
fi

# Get the ID of the first matching coffee
COFFEE_ID=$(echo "$RESPONSE" | jq -r '.[0].id')
COFFEE_ROASTER=$(echo "$RESPONSE" | jq -r '.[0].roaster')
COFFEE_DESC=$(echo "$RESPONSE" | jq -r '.[0].description')

echo "✅ Found coffee entry:"
echo "   ID: $COFFEE_ID"
echo "   Roaster: $COFFEE_ROASTER"
echo "   Description: $COFFEE_DESC"
echo ""

# Prepare the update data
UPDATE_DATA='{
  "percentarabica": 40,
  "percentrobusta": 60,
  "origin": "BR,HN,AS",
  "roastlevel": "medium",
  "tastenotes": "dark chocolate, spices, honey, roasted coffee, velvety",
  "url": "https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema",
  "brewingmethod": "espresso",
  "recommendedmethod": "espresso",
  "comment": "Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot."
}'

echo "📝 Updating database with the following information:"
echo "   • Arabica: 40%"
echo "   • Robusta: 60%"
echo "   • Origin: BR,HN,AS (Brazil, Honduras, Southeast Asia)"
echo "   • Roast Level: medium"
echo "   • Intensity: 7/10"
echo "   • Taste Notes: dark chocolate, spices, honey, roasted coffee, velvety"
echo ""

# Perform the update
UPDATE_RESPONSE=$(curl -s -X PATCH \
  "${SUPABASE_URL}/rest/v1/coffees?id=eq.${COFFEE_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$UPDATE_DATA")

# Check if update was successful
if echo "$UPDATE_RESPONSE" | jq -e '.[0].id' > /dev/null 2>&1; then
    echo "✅ Successfully updated Lavazza Gran Crema Barista!"
    echo ""
    echo "Updated fields:"
    echo "$UPDATE_RESPONSE" | jq -r '.[0] | "   Arabica: \(.percentarabica)%\n   Robusta: \(.percentrobusta)%\n   Origin: \(.origin)\n   Roast Level: \(.roastlevel)\n   Taste Notes: \(.tastenotes)"'
    echo ""
    echo "✨ Done! Your database has been updated."
else
    echo "❌ Error updating database!"
    echo "Response: $UPDATE_RESPONSE"
    exit 1
fi
