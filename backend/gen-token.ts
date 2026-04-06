import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const payload = {
  id: 'aff5e54d-85e3-4110-907f-7d03600c4a24', // Harish's ID from previous audit
  email: 'harish.s@eyelevelstudio.in',
  role: 'employee',
  name: 'Harish'
};

const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
console.log(token);
