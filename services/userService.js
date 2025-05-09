import supabase from "../config/supabaseClient.js";
import bcrypt from "bcrypt";
import twilio from "twilio";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_TOKEN;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phoneNumber, otp) => {
  try {
    const message = await twilioClient.messages.create({
      body: `Hi! Thanks for registering. Here is your verification code: ${otp}`,
      from: '+19592712080',
      to: `+${phoneNumber}`
    });
    return message.sid;
  } catch (error) {
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

const checkExistingUser = async (email, contactNumber) => {
  const { data, error } = await supabase
    .from("users")
    .select("email, contact_number")
    .or(`email.eq.${email},contact_number.eq.${contactNumber}`);

  if (error) throw new Error(error.message);
  
  if (data && data.length > 0) {
    const existingUser = data[0];
    if (existingUser.email === email) {
      throw new Error("Email already registered");
    }
    if (existingUser.contact_number === contactNumber) {
      throw new Error("Phone number already registered");
    }
  }
};

export const createUser = async (userData) => {
  // Validate required fields
  const requiredFields = ['full_name', 'email', 'password', 'contact_number'];
  for (const field of requiredFields) {
    if (!userData[field]) {
      throw new Error(`${field} is required`);
    }
  }

  await checkExistingUser(userData.email, userData.contact_number);

  const otp = generateOTP();

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  // Prepare user data
  const newUser = {
    ...userData,
    password: hashedPassword,
    display_name: userData.display_name || userData.full_name.split(' ')[0],
    otp,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("users")
    .insert([newUser])
    .select();

  if (error) throw new Error(error.message);

  // Send OTP via SMS
  try {
    await sendOTP(userData.contact_number, otp);
  } catch (smsError) {
    // If SMS fails, we should still return the user data but log the error
    console.error('Failed to send OTP:', smsError);
  }

  return data[0];
};

export const verifyOTP = async (userId, otp) => {
  const { data, error } = await supabase
    .from("users")
    .select("otp")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("User not found");

  if (data.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  // Clear OTP after successful verification
  const { error: updateError } = await supabase
    .from("users")
    .update({ otp: null, is_verified: true })
    .eq("id", userId);

  if (updateError) throw new Error(updateError.message);

  return { success: true, message: "OTP verified successfully" };
};

export const getUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, display_name, email, contact_number, profile_image, created_at, updated_at");

  if (error) throw new Error(error.message);
  return data;
};

export const getUserById = async (id) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
};

export const updateUser = async (id, updates) => {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteUser = async (id) => {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true, message: "User deleted successfully" };
};

export const searchUsers = async (query) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("name", `%${query}%`);

  if (error) throw new Error(error.message);
  return data;
};

export const loginUser = async (email, password) => {
  // Get user by email
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error("Invalid email or password");
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(password, data.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: data.id,
      email: data.email,
      role: data.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Remove sensitive data before sending response
  const { password: _, otp: __, ...userWithoutSensitiveData } = data;
  
  return {
    user: userWithoutSensitiveData,
    token,
    role: data.role || 'user'
  };
};