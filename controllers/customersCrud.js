require('dotenv').config()
const cloudinary = require('cloudinary').v2;

const Comment = require('../schema/comment');
const Customer = require("../schema/customers");
const Order = require('../schema/orders');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});


const registerCustomer = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImage,
        bio,
        password,
    } = req.body;

    console.log(req.body);

    try {
       
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(201).json({success: false,  error: 'Email already in use' });
        }

        
        const photoUrl = await cloudinary.uploader.upload(profileImage);

       
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const newCustomer = new Customer({
            firstName,
            lastName,
            email,
            phoneNumber,
            profileImage: photoUrl.url,
            bio,
            passwordHash: hash,
        });

        const savedCustomer = await newCustomer.save();
        res.status(201).json({success:true, savedCustomer});
    } catch (error) {
        console.error('Error during customer registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const loginCustomer = async (req, res) => {
    const { email, password } = req.body;

    try {
        const customer = await Customer.findOne({ email });

        if (!customer) {
            return res.status(200).json({success:false,  error: 'Customer not found' });
        }

        
        const passwordMatch = await bcrypt.compare(password, customer.passwordHash);

        if (!passwordMatch) {
            return res.status(200).json({success:false, error: 'Invalid password' });
        }

        
        if (!customer.username) {
            const username = email.split('@')[0]; 
            customer.username = username;
        }

       
        await customer.save();

        
        const token = jwt.sign({ customerId: customer._id }, process.env.JWT_SECRET, {
            expiresIn: '3h', 
        });

        res.cookie('token', token, {
            httpOnly: true, 
            
        });

        res.status(200).json({ message: 'Login successful', token, customer });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getProfile = async (req, res) => {
    try {
       
        const customerId = req.customerId;

       
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({success:false, error: 'Customer not found' });
        }

        
        res.status(200).json({success:true, customer });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updateCustomer = async (req, res) => {
    const customerId = req.params.id; 
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImage,
        bio,
        password,
    } = req.body;

    try {
        
        const existingCustomer = await Customer.findById(customerId);
        if (!existingCustomer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        
        if (email && email !== existingCustomer.email) {
            const emailInUse = await Customer.findOne({ email });
            if (emailInUse) {
                return res.status(400).json({ success: false, error: 'Email already in use' });
            }
        }

        
        let updatedProfileImage = existingCustomer.profileImage;
        if (profileImage) {
            const photoUrl = await cloudinary.uploader.upload(profileImage);
            updatedProfileImage = photoUrl.url;
        }

       
        let updatedPasswordHash = existingCustomer.passwordHash;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedPasswordHash = await bcrypt.hash(password, salt);
        }

        
        existingCustomer.firstName = firstName || existingCustomer.firstName;
        existingCustomer.lastName = lastName || existingCustomer.lastName;
        existingCustomer.email = email || existingCustomer.email;
        existingCustomer.phoneNumber = phoneNumber || existingCustomer.phoneNumber;
        existingCustomer.profileImage = updatedProfileImage;
        existingCustomer.bio = bio || existingCustomer.bio;
        existingCustomer.passwordHash = updatedPasswordHash;

        
        const updatedCustomer = await existingCustomer.save();

        res.status(200).json({ success: true, updatedCustomer });
    } catch (error) {
        console.error('Error during customer update:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const deleteCustomerById = async (req, res) => {
    const customerId = req.params.id;

    try {
        
        const existingCustomer = await Customer.findById(customerId);
        if (!existingCustomer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        
        await Order.deleteMany({ customer: customerId });

        await Comment.deleteMany({customerId:customerId});

        await Customer.findByIdAndDelete(customerId);

        res.status(200).json({ success: true, message: 'Customer and associated orders deleted successfully' });
    } catch (error) {
        console.error('Error during customer deletion:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const getAllCustomers = async (req, res) => {
    try {
        
        const customers = await Customer.find();

        res.status(200).json({ success: true, customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
const getCustomerById = async (req, res) => {
    const customerId = req.params.id; 

    try {
        
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        res.status(200).json({ success: true, customer });
    } catch (error) {
        console.error('Error fetching customer by ID:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
module.exports = {
    loginCustomer,
    registerCustomer,
    getProfile,
    updateCustomer,
    deleteCustomerById,
    getAllCustomers,
    getCustomerById
} 
  