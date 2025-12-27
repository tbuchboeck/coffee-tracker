#!/usr/bin/env node

/**
 * Script to update Lavazza Grand Crema Barista with detailed information
 *
 * This script searches for the Lavazza Grand Crema Barista entry in the database
 * and fills in missing details based on product research.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Detailed information about Lavazza Espresso Barista Gran Crema
const granCremaDetails = {
  percentArabica: 40,
  percentRobusta: 60,
  origin: 'BR,HN,AS', // Brazil, Honduras, Southeast Asia
  roastLevel: 'medium',
  tasteNotes: 'dark chocolate, spices, honey, roasted coffee, velvety',
  url: 'https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema',
  brewingMethod: 'espresso',
  recommendedMethod: 'espresso',
  comment: 'Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot.',
  // Keep existing favorite, cremaRating, tasteRating if already set
};

async function updateLavazzaGranCrema() {
  try {
    console.log('🔍 Searching for Lavazza Grand Crema Barista in database...\n');

    // Get all coffees
    const allCoffees = await coffeeService.getAllCoffees();

    // Search for Lavazza Grand Crema (case-insensitive)
    const granCrema = allCoffees.find(coffee => {
      const roaster = (coffee.roaster || '').toLowerCase();
      const description = (coffee.description || '').toLowerCase();

      return roaster.includes('lavazza') &&
             (description.includes('gran crema') ||
              description.includes('grand crema'));
    });

    if (!granCrema) {
      console.log('❌ Lavazza Grand Crema Barista not found in database.');
      console.log('📝 Make sure you have added this coffee to your database first.\n');
      console.log('Available Lavazza coffees in database:');

      const lavazzaCoffees = allCoffees.filter(c =>
        (c.roaster || '').toLowerCase().includes('lavazza')
      );

      if (lavazzaCoffees.length > 0) {
        lavazzaCoffees.forEach(c => {
          console.log(`  - ID ${c.id}: ${c.roaster} - ${c.description}`);
        });
      } else {
        console.log('  (none found)');
      }

      return;
    }

    console.log('✅ Found coffee entry:');
    console.log(`   ID: ${granCrema.id}`);
    console.log(`   Roaster: ${granCrema.roaster}`);
    console.log(`   Description: ${granCrema.description}`);
    console.log(`   Current Arabica: ${granCrema.percentArabica || 'not set'}`);
    console.log(`   Current Robusta: ${granCrema.percentRobusta || 'not set'}`);
    console.log('');

    // Prepare updates - only update fields that are empty or missing
    const updates = {};

    // Always update percentages as these are the key missing info
    if (!granCrema.percentArabica || granCrema.percentArabica === 0) {
      updates.percentArabica = granCremaDetails.percentArabica;
    }

    if (!granCrema.percentRobusta || granCrema.percentRobusta === 0) {
      updates.percentRobusta = granCremaDetails.percentRobusta;
    }

    // Update origin if empty or generic
    if (!granCrema.origin || granCrema.origin.trim() === '') {
      updates.origin = granCremaDetails.origin;
    }

    // Update roast level if empty
    if (!granCrema.roastLevel || granCrema.roastLevel.trim() === '') {
      updates.roastLevel = granCremaDetails.roastLevel;
    }

    // Update taste notes if empty
    if (!granCrema.tasteNotes || granCrema.tasteNotes.trim() === '') {
      updates.tasteNotes = granCremaDetails.tasteNotes;
    }

    // Update URL if empty
    if (!granCrema.url || granCrema.url.trim() === '') {
      updates.url = granCremaDetails.url;
    }

    // Update brewing method if empty
    if (!granCrema.brewingMethod || granCrema.brewingMethod.trim() === '') {
      updates.brewingMethod = granCremaDetails.brewingMethod;
    }

    // Update recommended method if empty
    if (!granCrema.recommendedMethod || granCrema.recommendedMethod.trim() === '') {
      updates.recommendedMethod = granCremaDetails.recommendedMethod;
    }

    // Enhance comment with intensity info if not already detailed
    if (!granCrema.comment || granCrema.comment.length < 20) {
      updates.comment = granCremaDetails.comment;
    }

    if (Object.keys(updates).length === 0) {
      console.log('ℹ️  All fields are already filled. No updates needed.\n');
      return;
    }

    console.log('📝 Updating the following fields:');
    Object.keys(updates).forEach(key => {
      console.log(`   ${key}: ${updates[key]}`);
    });
    console.log('');

    // Update the coffee in the database
    const result = await coffeeService.updateCoffee(granCrema.id, updates);

    if (result.success) {
      console.log('✅ Successfully updated Lavazza Grand Crema Barista!\n');
      console.log('Updated fields summary:');
      console.log(`   • Arabica: ${granCremaDetails.percentArabica}%`);
      console.log(`   • Robusta: ${granCremaDetails.percentRobusta}%`);
      console.log(`   • Origin: ${granCremaDetails.origin} (Brazil, Honduras, Southeast Asia)`);
      console.log(`   • Roast Level: ${granCremaDetails.roastLevel}`);
      console.log(`   • Intensity: 7/10`);
      console.log(`   • Taste Notes: ${granCremaDetails.tasteNotes}`);
      console.log('');
    } else {
      console.error('❌ Error updating coffee:', result.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the update
updateLavazzaGranCrema()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
