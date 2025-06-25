import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/store/profile';

export interface DatabaseProfile {
  id: string;
  user_id: string;
  email: string;
  profile_photo?: string;
  cover_photo?: string;
  full_name: string;
  birthday?: string;
  bio: string;
  job: string;
  fashion: string;
  age?: number;
  relationship_status: string;
  location?: string;
  website?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithInterests {
  profile: DatabaseProfile;
  interests: string[];
}

class ProfileService {
  // Get the correct public URL for an image with enhanced error handling
  getImageUrl(path: string): string {
    if (!path) {
      console.log('getImageUrl: No path provided');
      return '';
    }
    
    // If it's already a full URL, return as is
    if (path.startsWith('http')) {
      console.log('getImageUrl: Already a full URL:', path);
      return path;
    }
    
    // If it's a base64 data URL, return as is
    if (path.startsWith('data:')) {
      console.log('getImageUrl: Base64 data URL, length:', path.length);
      return path;
    }
    
    // Get public URL from Supabase storage
    try {
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(path);
      
      console.log('getImageUrl: Generated public URL for path:', path, '-> URL:', data.publicUrl);
      
      // Verify the URL format
      if (data.publicUrl && data.publicUrl.includes('/storage/v1/object/public/')) {
        return data.publicUrl;
      } else {
        console.error('getImageUrl: Invalid URL format generated:', data.publicUrl);
        return path; // Return original path as fallback
      }
    } catch (error) {
      console.error('getImageUrl: Error generating public URL:', error);
      return path; // Return original path as fallback
    }
  }

  // Test if an image URL is accessible
  async testImageUrl(url: string): Promise<{ accessible: boolean; error?: string }> {
    try {
      console.log('Testing image URL accessibility:', url);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        console.log('Image URL is accessible:', url);
        return { accessible: true };
      } else {
        const error = `HTTP ${response.status}: ${response.statusText}`;
        console.error('Image URL not accessible:', url, error);
        return { accessible: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Image URL test failed:', url, errorMessage);
      return { accessible: false, error: errorMessage };
    }
  }

  // Upload photo to Supabase Storage with proper folder structure
  async uploadPhoto(file: File, bucket: 'profile-photos' | 'cover-photos', userId: string): Promise<string> {
    try {
      console.log('Starting photo upload:', { fileName: file.name, fileType: file.type, fileSize: file.size, bucket, userId });
      
      // Validate file type - FIXED: More comprehensive validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        console.error('Invalid file type:', file.type, 'Allowed types:', allowedTypes);
        throw new Error(`Invalid file type: ${file.type}. Please upload a JPEG, PNG, WebP, or GIF image.`);
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${bucket}/${userId}/${fileName}`;

      console.log('Uploading file to path:', filePath);

      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Test the uploaded image URL
      const publicUrl = this.getImageUrl(filePath);
      const urlTest = await this.testImageUrl(publicUrl);
      
      if (!urlTest.accessible) {
        console.warn('Uploaded image may not be accessible:', urlTest.error);
      }

      // Return the file path (not the full URL) to store in database
      return filePath;
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw error;
    }
  }

  // Convert base64 to file and upload
  async uploadBase64Photo(base64Data: string, bucket: 'profile-photos' | 'cover-photos', userId: string): Promise<string> {
    try {
      console.log('Converting base64 to file for upload...');
      
      // Extract the actual base64 data (remove data:image/...;base64, prefix)
      const base64Parts = base64Data.split(',');
      if (base64Parts.length !== 2) {
        throw new Error('Invalid base64 data format');
      }

      const mimeType = base64Parts[0].match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      const base64String = base64Parts[1];
      
      console.log('Detected MIME type:', mimeType);
      
      // Convert base64 to blob
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create file from blob
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const file = new File([blob], `photo.${fileExtension}`, { type: mimeType });
      
      console.log('File created from base64:', { name: file.name, size: file.size, type: file.type });
      
      return await this.uploadPhoto(file, bucket, userId);
    } catch (error) {
      console.error('Base64 upload failed:', error);
      throw error;
    }
  }

  // Get user profile with interests - try both table structures
  async getUserProfile(userId: string): Promise<ProfileWithInterests | null> {
    try {
      console.log('Getting profile for user:', userId);
      
      // First try the new user_profiles table with RPC function
      try {
        const { data, error } = await supabase
          .rpc('get_user_profile_with_interests', { profile_user_id: userId });

        if (!error && data) {
          console.log('Profile data received from RPC:', data);
          return data;
        } else {
          console.log('RPC function failed or returned null:', error);
        }
      } catch (rpcError) {
        console.log('RPC function not available:', rpcError);
      }

      // Fallback: Try direct query on user_profiles table
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!profileError && profileData) {
          // Get interests separately
          const { data: interestsData } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_id', userId);

          const interests = interestsData?.map(item => item.interest) || [];

          console.log('Profile data received from direct query:', profileData);
          return {
            profile: profileData,
            interests
          };
        } else {
          console.log('Direct query on user_profiles failed:', profileError);
        }
      } catch (directError) {
        console.log('Direct query failed:', directError);
      }

      // Final fallback: Try old profiles table
      try {
        const { data: oldProfileData, error: oldProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!oldProfileError && oldProfileData) {
          console.log('Profile data received from old profiles table:', oldProfileData);
          
          // Convert old profile format to new format
          const convertedProfile: DatabaseProfile = {
            id: oldProfileData.id,
            user_id: oldProfileData.id,
            email: oldProfileData.email,
            profile_photo: oldProfileData.avatar_url,
            cover_photo: '',
            full_name: oldProfileData.full_name || '',
            birthday: '',
            bio: '',
            job: '',
            fashion: '',
            age: undefined,
            relationship_status: 'prefer-not-to-say',
            location: '',
            website: '',
            phone: '',
            created_at: oldProfileData.created_at,
            updated_at: oldProfileData.updated_at
          };

          return {
            profile: convertedProfile,
            interests: []
          };
        }
      } catch (oldError) {
        console.log('Old profiles table query failed:', oldError);
      }

      console.log('No profile found for user:', userId);
      return null;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  }

  // Create or update user profile - try multiple methods
  async upsertUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<string> {
    try {
      console.log('Upserting profile for user:', userId, profileData);
      
      let profilePhotoPath = profileData.profilePhoto;
      let coverPhotoPath = profileData.coverPhoto;

      // Handle photo uploads if they are base64 data
      if (profileData.profilePhoto && profileData.profilePhoto.startsWith('data:')) {
        console.log('Uploading profile photo...');
        try {
          profilePhotoPath = await this.uploadBase64Photo(
            profileData.profilePhoto, 
            'profile-photos', 
            userId
          );
          console.log('Profile photo uploaded to path:', profilePhotoPath);
        } catch (uploadError) {
          console.error('Profile photo upload failed:', uploadError);
          // Keep the base64 data as fallback
          profilePhotoPath = profileData.profilePhoto;
        }
      }

      if (profileData.coverPhoto && profileData.coverPhoto.startsWith('data:')) {
        console.log('Uploading cover photo...');
        try {
          coverPhotoPath = await this.uploadBase64Photo(
            profileData.coverPhoto, 
            'cover-photos', 
            userId
          );
          console.log('Cover photo uploaded to path:', coverPhotoPath);
        } catch (uploadError) {
          console.error('Cover photo upload failed:', uploadError);
          // Keep the base64 data as fallback
          coverPhotoPath = profileData.coverPhoto;
        }
      }

      // Convert birthday to date format
      let birthdayDate = null;
      if (profileData.birthday) {
        birthdayDate = profileData.birthday;
      }

      let profileId = null;

      // Method 1: Try RPC function
      try {
        const { data, error } = await supabase
          .rpc('upsert_user_profile', {
            profile_user_id: userId,
            profile_email: profileData.email || '',
            profile_photo: profilePhotoPath || null,
            cover_photo: coverPhotoPath || null,
            full_name: profileData.fullName || '',
            birthday: birthdayDate,
            bio: profileData.bio || '',
            job: profileData.job || '',
            fashion: profileData.fashion || '',
            age: profileData.age || null,
            relationship_status: profileData.relationshipStatus || 'prefer-not-to-say',
            location: profileData.location || null,
            website: profileData.website || null,
            phone: profileData.phone || null
          });

        if (!error && data) {
          console.log('Profile upserted successfully with RPC:', data);
          profileId = data;
        } else {
          console.error('RPC upsert failed:', error);
        }
      } catch (rpcError) {
        console.error('RPC upsert exception:', rpcError);
      }

      // Method 2: Try direct upsert on user_profiles table
      if (!profileId) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: userId,
              email: profileData.email || '',
              profile_photo: profilePhotoPath || null,
              cover_photo: coverPhotoPath || null,
              full_name: profileData.fullName || '',
              birthday: birthdayDate,
              bio: profileData.bio || '',
              job: profileData.job || '',
              fashion: profileData.fashion || '',
              age: profileData.age || null,
              relationship_status: profileData.relationshipStatus || 'prefer-not-to-say',
              location: profileData.location || null,
              website: profileData.website || null,
              phone: profileData.phone || null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
            .select('id')
            .single();

          if (!error && data) {
            console.log('Profile upserted successfully with direct query:', data);
            profileId = data.id;
          } else {
            console.error('Direct upsert failed:', error);
          }
        } catch (directError) {
          console.error('Direct upsert exception:', directError);
        }
      }

      // Method 3: Try old profiles table as fallback
      if (!profileId) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: profileData.email || '',
              full_name: profileData.fullName || '',
              avatar_url: profilePhotoPath || null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select('id')
            .single();

          if (!error && data) {
            console.log('Profile upserted successfully in old profiles table:', data);
            profileId = data.id;
          } else {
            console.error('Old profiles table upsert failed:', error);
          }
        } catch (oldError) {
          console.error('Old profiles table upsert exception:', oldError);
        }
      }

      if (!profileId) {
        throw new Error('All profile upsert methods failed');
      }

      return profileId;
    } catch (error) {
      console.error('Upsert profile failed:', error);
      throw error;
    }
  }

  // Update user interests
  async updateUserInterests(userId: string, interests: string[]): Promise<void> {
    try {
      console.log('Updating interests for user:', userId, interests);
      
      // Try RPC function first
      try {
        const { error } = await supabase
          .rpc('upsert_user_interests', {
            profile_user_id: userId,
            interests_array: interests
          });

        if (!error) {
          console.log('Interests updated successfully with RPC');
          return;
        } else {
          console.error('RPC interests update failed:', error);
        }
      } catch (rpcError) {
        console.error('RPC interests update exception:', rpcError);
      }

      // Fallback: Direct database operations
      try {
        // Delete existing interests
        const { error: deleteError } = await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Delete interests failed:', deleteError);
        }

        // Insert new interests
        if (interests && interests.length > 0) {
          const interestRows = interests.map(interest => ({
            user_id: userId,
            interest: interest
          }));

          const { error: insertError } = await supabase
            .from('user_interests')
            .insert(interestRows);

          if (insertError) {
            console.error('Insert interests failed:', insertError);
            throw new Error(`Failed to update interests: ${insertError.message}`);
          }
        }

        console.log('Interests updated successfully with direct operations');
      } catch (directError) {
        console.error('Direct interests update failed:', directError);
        throw directError;
      }
    } catch (error) {
      console.error('Update interests failed:', error);
      throw error;
    }
  }

  // Save complete profile (profile + interests)
  async saveCompleteProfile(userId: string, profileData: UserProfile): Promise<void> {
    try {
      console.log('Saving complete profile for user:', userId);
      
      // Save profile data
      await this.upsertUserProfile(userId, profileData);

      // Save interests
      if (profileData.interests && profileData.interests.length > 0) {
        await this.updateUserInterests(userId, profileData.interests);
      } else {
        // Clear interests if none provided
        await this.updateUserInterests(userId, []);
      }

      console.log('Complete profile saved successfully');
    } catch (error) {
      console.error('Save complete profile failed:', error);
      throw error;
    }
  }

  // Convert database profile to UserProfile format with enhanced URL handling
  convertToUserProfile(dbProfile: ProfileWithInterests): UserProfile {
    const profilePhoto = this.getImageUrl(dbProfile.profile.profile_photo || '');
    const coverPhoto = this.getImageUrl(dbProfile.profile.cover_photo || '');
    
    console.log('Converting profile photos:', {
      originalProfilePhoto: dbProfile.profile.profile_photo,
      convertedProfilePhoto: profilePhoto,
      originalCoverPhoto: dbProfile.profile.cover_photo,
      convertedCoverPhoto: coverPhoto
    });

    // Test image URLs asynchronously (don't block the conversion)
    if (profilePhoto && profilePhoto.startsWith('http')) {
      this.testImageUrl(profilePhoto).then(result => {
        if (!result.accessible) {
          console.warn('Profile photo may not be accessible:', result.error);
        }
      });
    }

    if (coverPhoto && coverPhoto.startsWith('http')) {
      this.testImageUrl(coverPhoto).then(result => {
        if (!result.accessible) {
          console.warn('Cover photo may not be accessible:', result.error);
        }
      });
    }

    return {
      id: dbProfile.profile.id,
      email: dbProfile.profile.email,
      profilePhoto,
      coverPhoto,
      fullName: dbProfile.profile.full_name,
      birthday: dbProfile.profile.birthday || '',
      bio: dbProfile.profile.bio,
      job: dbProfile.profile.job,
      fashion: dbProfile.profile.fashion,
      age: dbProfile.profile.age,
      relationshipStatus: dbProfile.profile.relationship_status,
      location: dbProfile.profile.location || '',
      interests: dbProfile.interests || [],
      website: dbProfile.profile.website || '',
      phone: dbProfile.profile.phone || '',
      createdAt: dbProfile.profile.created_at,
      updatedAt: dbProfile.profile.updated_at,
    };
  }

  // Delete user profile and associated photos
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      console.log('Deleting profile for user:', userId);
      
      // Delete photos from storage first
      try {
        const { data: profilePhotos } = await supabase.storage
          .from('user-uploads')
          .list(`profile-photos/${userId}`);
        
        const { data: coverPhotos } = await supabase.storage
          .from('user-uploads')
          .list(`cover-photos/${userId}`);

        // Delete profile photos
        if (profilePhotos && profilePhotos.length > 0) {
          const profilePaths = profilePhotos.map(photo => `profile-photos/${userId}/${photo.name}`);
          await supabase.storage.from('user-uploads').remove(profilePaths);
        }

        // Delete cover photos
        if (coverPhotos && coverPhotos.length > 0) {
          const coverPaths = coverPhotos.map(photo => `cover-photos/${userId}/${photo.name}`);
          await supabase.storage.from('user-uploads').remove(coverPaths);
        }
      } catch (storageError) {
        console.warn('Error deleting photos from storage:', storageError);
        // Continue with profile deletion even if photo deletion fails
      }

      // Try deleting from user_profiles table first
      try {
        // Delete interests first (due to foreign key)
        const { error: interestsError } = await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', userId);

        if (interestsError) {
          console.error('Delete interests error:', interestsError);
        }

        // Delete profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) {
          console.error('Delete user_profiles error:', profileError);
          
          // Try deleting from old profiles table
          const { error: oldProfileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

          if (oldProfileError) {
            console.error('Delete old profiles error:', oldProfileError);
            throw new Error(`Failed to delete profile: ${oldProfileError.message}`);
          }
        }
      } catch (deleteError) {
        console.error('Delete profile failed:', deleteError);
        throw deleteError;
      }

      console.log('Profile deleted successfully');
    } catch (error) {
      console.error('Delete profile failed:', error);
      throw error;
    }
  }

  // Check if user has a profile - check both tables
  async hasProfile(userId: string): Promise<boolean> {
    try {
      // Check user_profiles table first
      const { data: newProfile, error: newError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!newError && newProfile) {
        return true;
      }

      // Check old profiles table
      const { data: oldProfile, error: oldError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!oldError && oldProfile) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Check profile failed:', error);
      return false;
    }
  }

  // Delete a specific photo
  async deletePhoto(photoUrl: string, userId: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const userIdFromUrl = urlParts[urlParts.length - 3];
      
      // Verify the user owns this photo
      if (userIdFromUrl !== userId) {
        throw new Error('Unauthorized: Cannot delete photo that does not belong to you');
      }

      const filePath = `${folder}/${userId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (error) {
        console.error('Delete photo error:', error);
        throw new Error(`Failed to delete photo: ${error.message}`);
      }

      console.log('Photo deleted successfully:', filePath);
    } catch (error) {
      console.error('Delete photo failed:', error);
      throw error;
    }
  }

  // Get signed URL for private images (if needed)
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        throw new Error(`Failed to get signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Get signed URL failed:', error);
      throw error;
    }
  }

  // FIXED: Validate image data before processing - now properly validates all image types
  validateImageData(imageData: string): boolean {
    if (!imageData) {
      console.log('validateImageData: No image data provided');
      return false;
    }
    
    // Check if it's a valid base64 data URL
    if (imageData.startsWith('data:image/')) {
      const base64Parts = imageData.split(',');
      if (base64Parts.length !== 2 || base64Parts[1].length === 0) {
        console.error('validateImageData: Invalid base64 format');
        return false;
      }
      
      // Extract and validate MIME type
      const mimeTypeMatch = base64Parts[0].match(/data:([^;]+)/);
      if (!mimeTypeMatch) {
        console.error('validateImageData: Could not extract MIME type');
        return false;
      }
      
      const mimeType = mimeTypeMatch[1].toLowerCase();
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      
      if (!allowedMimeTypes.includes(mimeType)) {
        console.error('validateImageData: Invalid MIME type:', mimeType, 'Allowed:', allowedMimeTypes);
        return false;
      }
      
      console.log('validateImageData: Valid base64 image data with MIME type:', mimeType);
      return true;
    }
    
    // Check if it's a valid URL
    if (imageData.startsWith('http')) {
      try {
        new URL(imageData);
        console.log('validateImageData: Valid HTTP URL');
        return true;
      } catch {
        console.error('validateImageData: Invalid URL format');
        return false;
      }
    }
    
    // Check if it's a valid storage path
    if (imageData.includes('/') && imageData.length > 0) {
      console.log('validateImageData: Valid storage path');
      return true;
    }
    
    console.error('validateImageData: Unknown image data format:', imageData.substring(0, 50));
    return false;
  }

  // Debug function to check storage bucket configuration
  async debugStorageBucket(): Promise<void> {
    try {
      console.log('=== Storage Bucket Debug Info ===');
      
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        return;
      }
      
      const userUploadsBucket = buckets.find(bucket => bucket.id === 'user-uploads');
      
      if (userUploadsBucket) {
        console.log('user-uploads bucket found:', userUploadsBucket);
      } else {
        console.error('user-uploads bucket NOT found. Available buckets:', buckets.map(b => b.id));
      }
      
      // Test a sample upload
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload('test/test.txt', testFile);
      
      if (uploadError) {
        console.error('Test upload failed:', uploadError);
      } else {
        console.log('Test upload successful:', uploadData);
        
        // Clean up test file
        await supabase.storage.from('user-uploads').remove(['test/test.txt']);
      }
      
      console.log('=== End Storage Debug ===');
    } catch (error) {
      console.error('Storage debug failed:', error);
    }
  }

  // Debug function to check database tables and functions
  async debugDatabase(): Promise<void> {
    try {
      console.log('=== Database Debug Info ===');
      
      // Check if user_profiles table exists
      try {
        const { error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        
        if (userProfilesError) {
          console.error('user_profiles table not accessible:', userProfilesError);
        } else {
          console.log('user_profiles table is accessible');
        }
      } catch (error) {
        console.error('user_profiles table test failed:', error);
      }

      // Check if old profiles table exists
      try {
        const { error: profilesError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (profilesError) {
          console.error('profiles table not accessible:', profilesError);
        } else {
          console.log('profiles table is accessible');
        }
      } catch (error) {
        console.error('profiles table test failed:', error);
      }

      // Check if RPC functions exist
      try {
        const { error: rpcError } = await supabase
          .rpc('get_user_profile_with_interests', { profile_user_id: '00000000-0000-0000-0000-000000000000' });
        
        if (rpcError && rpcError.code !== 'PGRST116') {
          console.error('get_user_profile_with_interests RPC not available:', rpcError);
        } else {
          console.log('get_user_profile_with_interests RPC is available');
        }
      } catch (error) {
        console.error('RPC function test failed:', error);
      }

      console.log('=== End Database Debug ===');
    } catch (error) {
      console.error('Database debug failed:', error);
    }
  }
}

export const profileService = new ProfileService();