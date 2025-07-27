import { Express, Request, Response } from "express";
import { storage } from "./storage";
import crypto from 'crypto';
import { z } from "zod";

// Schema for validating user creation requests
const createUserSchema = z.object({
  firebase_uid: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email format"),
});

export function setupAuthRoutes(app: Express) {
  // Create a new user (from registration)
  app.post("/api/users/create", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: validation.error.format() 
        });
      }

      const { firebase_uid, name, phone, email } = validation.data;

      // Check if user with the same phone already exists
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(409).json({ message: "User with this phone number already exists" });
      }

      // Generate keypair for signing transactions
      const { publicKey, privateKey } = generateKeyPair();

      // Create user in our database
      const newUser = await storage.createUser({
        name,
        phone,
        public_key: publicKey,
        private_key: privateKey,
        balance: "10000", // Default starting balance
        emergency_balance: "3000", // Default emergency balance
        firebase_uid: firebase_uid || null
      });

      // Return the user without the private key
      const { private_key, ...userWithoutPrivateKey } = newUser;
      
      res.status(201).json(userWithoutPrivateKey);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Check if a Google user exists in our database
  app.get("/api/users/check-google-user/:firebaseUid", async (req: Request, res: Response) => {
    try {
      const { firebaseUid } = req.params;
      
      // In a real app, we would query by firebase_uid
      // For our demo, we'll just return success if the ID exists
      if (firebaseUid) {
        // Simulating user check - in a real app, you would check the database
        // const user = await storage.getUserByFirebaseUid(firebaseUid);
        // if (user) {
        //   return res.status(200).json({ exists: true });
        // }
        
        // For demo purposes, just return 404 to trigger new user creation
        return res.status(404).json({ exists: false });
      }
      
      res.status(400).json({ message: "Invalid Firebase UID" });
    } catch (error) {
      console.error("Error checking Google user:", error);
      res.status(500).json({ message: "Failed to check user" });
    }
  });
}

// Helper function to generate a keypair for signing transactions
function generateKeyPair() {
  // For demo purposes, we're generating simple keys
  // In production, you'd use proper ED25519 keys
  return {
    publicKey: crypto.randomBytes(32).toString('hex'),
    privateKey: crypto.randomBytes(64).toString('hex')
  };
}