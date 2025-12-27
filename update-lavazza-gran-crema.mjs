#!/usr/bin/env node

/**
 * Script to update Lavazza Grand Crema Barista with detailed information
 *
 * This script searches for the Lavazza Grand Crema Barista entry in the database
 * and fills in missing details based on product research.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config();
}

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Detailed information about Lavazza Espresso Barista Gran Crema
const granCremaDetails = {
  percentarabica: 40,
  percentrobusta: 60,
  origin: 'BR,HN,AS', // Brazil, Honduras, Southeast Asia
  roastlevel: 'medium',
  tastenotes: 'dark chocolate, spices, honey, roasted coffee, velvety',
  url: 'https://www.lavazza.com/en/coffee-beans/espresso-barista-gran-crema',
  brewingmethod: 'espresso',
  recommendedmethod: 'espresso',
  comment: 'Intensity 7/10, smooth medium roast, blend of South American Arabica (40%) and Southeast Asian Robusta (60%). Best for espresso machine or moka pot.',
};

async function updateLavazzaGranCrema() {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.\n');
      console.log('The coffee might be in localStorage. Please check your browser.\n');
      return;
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('🔍 Searching for Lavazza Grand Crema Barista in database...\n');

    // Get all coffees
    const { data: allCoffees, error: fetchError } = await supabase
      .from('coffees')
      .select('*')
      .order('cuppingtime', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching coffees:', fetchError.message);
      return;
    }

    if (!allCoffees || allCoffees.length === 0) {
      console.log('ℹ️  No coffees found in database.\n');
      return;
    }

    // Search for Lavazza Grand Crema (case-insensitive)
    const granCrema = allCoffees.find(coffee => {
      const roaster = (coffee.roaster || '').toLowerCase();
      const description = (coffee.description || '').toLowerCase();

      return roaster.includes('lavazza') &&
             (description.includes('gran crema') ||
              description.includes('grand crema') ||
              description.includes('barista gran'));
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
    console.log(`   Current Arabica: ${granCrema.percentarabica || 'not set'}`);
    console.log(`   Current Robusta: ${granCrema.percentrobusta || 'not set'}`);
    console.log('');

    // Prepare updates - only update fields that are empty or missing
    const updates = {};

    // Always update percentages as these are the key missing info
    if (!granCrema.percentarabica || granCrema.percentarabica === 0) {
      updates.percentarabica = granCremaDetails.percentarabica;
    }

    if (!granCrema.percentrobusta || granCrema.percentrobusta === 0) {
      updates.percentrobusta = granCremaDetails.percentrobusta;
    }

    // Update origin if empty or generic
    if (!granCrema.origin || granCrema.origin.trim() === '') {
      updates.origin = granCremaDetails.origin;
    }

    // Update roast level if empty
    if (!granCrema.roastlevel || granCrema.roastlevel.trim() === '') {
      updates.roastlevel = granCremaDetails.roastlevel;
    }

    // Update taste notes if empty
    if (!granCrema.tastenotes || granCrema.tastenotes.trim() === '') {
      updates.tastenotes = granCremaDetails.tastenotes;
    }

    // Update URL if empty
    if (!granCrema.url || granCrema.url.trim() === '') {
      updates.url = granCremaDetails.url;
    }

    // Update brewing method if empty
    if (!granCrema.brewingmethod || granCrema.brewingmethod.trim() === '') {
      updates.brewingmethod = granCremaDetails.brewingmethod;
    }

    // Update recommended method if empty
    if (!granCrema.recommendedmethod || granCrema.recommendedmethod.trim() === '') {
      updates.recommendedmethod = granCremaDetails.recommendedmethod;
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
    const { data: updatedData, error: updateError } = await supabase
      .from('coffees')
      .update(updates)
      .eq('id', granCrema.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating coffee:', updateError.message);
      return;
    }

    console.log('✅ Successfully updated Lavazza Grand Crema Barista!\n');
    console.log('Updated fields summary:');
    console.log(`   • Arabica: ${granCremaDetails.percentarabica}%`);
    console.log(`   • Robusta: ${granCremaDetails.percentrobusta}%`);
    console.log(`   • Origin: ${granCremaDetails.origin} (Brazil, Honduras, Southeast Asia)`);
    console.log(`   • Roast Level: ${granCremaDetails.roastlevel}`);
    console.log(`   • Intensity: 7/10`);
    console.log(`   • Taste Notes: ${granCremaDetails.tastenotes}`);
    console.log('');

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
