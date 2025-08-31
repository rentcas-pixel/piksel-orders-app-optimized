import { supabase } from './supabase';
import { Comment, Reminder, FileAttachment } from '@/types';

export class SupabaseService {
  // Comments
  static async getComments(orderId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Load printscreens for this order
    const printscreens = await this.getPrintscreensForOrder(orderId);
    
    // Add printscreens to all comments (simple approach)
    const commentsWithPrintscreens = (data || []).map(comment => ({
      ...comment,
      printscreens: printscreens
    }));
    
    return commentsWithPrintscreens;
  }

  static async getPrintscreensForOrder(orderId: string): Promise<FileAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to load printscreens:', error);
        return [];
      }
      
      // Filter printscreens on client side
      const printscreens = (data || []).filter(file => 
        file.file_type && file.file_type.startsWith('image/')
      );
      

      return printscreens;
      
    } catch (error) {
      console.error('❌ Error loading printscreens:', error);
      return [];
    }
  }

  static async addComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ 
        ...comment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateComment(id: string, text: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ text, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Reminders
  static async getReminders(orderId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('order_id', orderId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async addReminder(orderId: string, reminder: Omit<Reminder, 'id' | 'order_id' | 'created_at'>): Promise<Reminder> {
    const { data, error } = await supabase
      .from('reminders')
      .insert([{ 
        order_id: orderId, 
        ...reminder,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteReminder(id: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // File Attachments
  static async getFiles(orderId: string): Promise<FileAttachment[]> {
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async uploadFile(file: File, orderId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const storagePath = `orders/${orderId}/${fileName}`;
      
      // Upload file to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-files')
        .upload(storagePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('order-files')
        .getPublicUrl(storagePath);
      
      // Save metadata to database
      const metadata = {
        order_id: orderId,
        file_name: file.name,
        file_path: storagePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date().toISOString()
      };
      
      const { error: metadataError } = await supabase
        .from('order_files')
        .insert(metadata);
      
      if (metadataError) throw metadataError;
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  static async uploadPrintscreen(orderId: string, file: File): Promise<FileAttachment> {
    try {
      // 1. Įkelti printscreen į Supabase Storage
      const fileName = `printscreen_${Date.now()}_${file.name}`;
      const storagePath = `${orderId}/printscreens/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(storagePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // 2. Gauti public URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(storagePath);
      
      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      // 3. Išsaugoti printscreen metaduomenis į DB
      const metadata = {
        order_id: orderId,
        filename: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || 'image/png',
        created_at: new Date().toISOString()
      };
      
      const { data: fileData, error: insertError } = await supabase
        .from('file_attachments')
        .insert([metadata])
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      return {
        id: fileData.id,
        order_id: orderId,
        filename: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || 'image/png',
        created_at: fileData.created_at
      };
      
    } catch (error) {
      console.error('Printscreen upload failed:', error);
      throw error;
    }
  }

  static async deleteFile(id: string): Promise<void> {
    const { data: file, error: fetchError } = await supabase
      .from('file_attachments')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from URL - get everything after the bucket name
    const url = new URL(file.file_url);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'files');
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    const { error: deleteError } = await supabase.storage
      .from('files')
      .remove([filePath]);

    if (deleteError) {
      throw deleteError;
    }

    const { error: dbError } = await supabase
      .from('file_attachments')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw dbError;
    }
  }
}
