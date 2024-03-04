const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const Event = require('./models/eventModel');
const User = require('./models/userModel');
const Volunteer = require('./models/volunteerModel');
const Organisation = require('./models/orgModel');
const Clothing = require('./models/clothingModel');
const PurchasedClothing = require('./models/purchasedClothingModel');
const Application = require('./models/appplicationModel');
const Avatar = require('./models/avatarModel');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = 3000;
const username = "";

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const randomKey = crypto.randomBytes(32).toString('hex');
const uri = 'mongodb+srv://alyssachang1408:F8niS150UA6jE3Ha@cluster0.afrdfh3.mongodb.net/testDatabase';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    cb(null, `${timestamp}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage: storage });

app.use('/images', express.static('images'));

async function connect() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const docs = await Event.find({});

        const aofcheckboxes = [
          { value: 'artsandmusic', label: 'Arts & Music' },
          { value: 'animals', label: 'Animals' },
          { value: 'education', label: 'Education' },
          { value: 'sportsandrecreation', label: 'Sports & Recreation' },
          { value: 'disasterrelief', label: 'Disaster Relief' }
        ];
          
        // Log the documents
        console.log('Documents:', docs);
        console.log(randomKey);

        // function getUserFromSession(session) {
        // }

        app.use(session({
          secret: randomKey,
          resave: false,
          saveUninitialized: true,
        }));
          
        // Home Page
        app.get('/', async (req, res) => {
          const current_username = req.session.username;
          console.log("Home -- " + current_username);
          //find recommended events here
          //usertype
          const userDocument = await User.findOne({ username: current_username });
          let recommendedEvents = [];
          
          if (current_username && userDocument.userType === "volunteer") {
            const volunteerDocument = await Volunteer.findOne({ username: req.session.username });
            const volunteerSkills = volunteerDocument.skills || [];

            recommendedEvents = await Event.find({
              aof: {
                $in: volunteerSkills.map(skill => new RegExp(skill, 'i')),
              },
            });
          }
          res.render('index', { events: docs, current_username, userDocument, recommendedEvents });
        });

        //Login Page
        app.get('/login', (req, res) => {
          // username = req.session.username;
          res.render('login');
        });

        app.get('/signup', (req, res) => {
          res.render('signUp');
        });

        app.get('/volunteersignup', (req, res) => {
          res.render('volunteerSignUp');
        });

        app.get('/orgsignup', (req, res) => {
          res.render('orgSignUp');
        });

        app.get('/createevent', (req, res) => {
          res.render('createEvent', { aofcheckboxes });
        });

        app.get('/purchaseditems', async (req, res) => {
          const current_username = req.session.username;

          const avatarDocument = await Avatar.findOne({ username: current_username });

          const purchasedClothesDocument = await PurchasedClothing.find({ username: current_username });
          const purchasedClothesDetails = [];

          // Loop through each purchased clothing document
          for (const purchaseDoc of purchasedClothesDocument) {
          // Find the corresponding clothingItemInfo based on the id
          const clothingInfo = await Clothing.findById(purchaseDoc.item_id);

          // Add the details to the array
          purchasedClothesDetails.push({
            _id: clothingInfo._id,
            category: clothingInfo.category,
            item_name: clothingInfo.item_name,
            item_image: clothingInfo.item_image,
            item_description: clothingInfo.item_description,
          });

          console.log(purchasedClothesDetails);
        }
          res.render('purchasedItems', { purchasedClothesDetails, avatarDocument });
        });

        app.get('/shop', async (req, res) => {
          //render all items
          const allClothing = await Clothing.find({});
          console.log(allClothing);
          res.render('shop', { allClothing });
        });

        app.get('/editevent/:eventId', async (req, res) => {
          const eventId = req.params.eventId;
          try {
            // Fetch the event details from the database based on eventId
            const event = await Event.findById(eventId);
    
            if (!event) {
                // Handle event not found
                return res.status(404).send('Event not found');
            }
    
            // Render the edit event form with the event details
            res.render('editEvent', { event, aofcheckboxes });
        } catch (error) {
            console.error('Error fetching event details for edit:', error);
            res.status(500).send('Internal Server Error');
        }
        });


        // Profile Page
        app.get('/profile', async (req, res) => {
          const current_username = req.session.username;
          console.log("Profile -- " + current_username);
          //find user from database, if usertype is volunteer, render volunteer profile. If otherwise, render organisation profile

          const userDocument = await User.findOne({ username: current_username });
          console.log(userDocument);

          if (userDocument.userType == "volunteer") {
            const volunteerDocument = await Volunteer.findOne({ username: current_username });

            //find useravatar and render equippeditems
            const avatarDocument = await Avatar.findOne({ username: current_username });
            console.log(avatarDocument);

            const applicationsDocument = await Application.find({ volunteer_id: current_username});
            const applicationDetails = [];

            for (const applicationsDoc of applicationsDocument) {
              // Find the corresponding clothingItemInfo based on the id
              const applicationInfo = await Event.findById(applicationsDoc.event_id);

              // Add the details to the array
              applicationDetails.push({
                event_id: applicationInfo._id,
                org_id: applicationInfo.org_id,
                event_name: applicationInfo.event_name,
                event_location: applicationInfo.event_location
              });
            }

            res.render('volunteerProfile', { current_username, userDocument, volunteerDocument, avatarDocument, applicationDetails });

          }
          else if (userDocument.userType == "organisation") {
            const orgDocument = await Organisation.findOne({ username: current_username });
            //find events created by this user
            const createdEvents = await Event.find({org_id: current_username});

            console.log('Base64 Image Data:',orgDocument.logo_image.data);

            res.render('orgProfile', { current_username, userDocument, orgDocument, createdEvents });
          }
          else {
            console.log("OI FAIL");
          }
          //res.render('profile', { current_username });
      });


        // Search Function
      app.get('/search', async (req, res) => {
            let query = {};
            
            // Check if there's a search query
            if (req.query.search) {
                // Customize the search logic based on your requirements
                query = {
                    $or: [
                        { event_name: { $regex: req.query.search, $options: 'i' } },
                        { event_description: { $regex: req.query.search, $options: 'i' } },
                        // Add more fields to search if needed
                    ]
                };
            }
        
            // Fetch events based on the search query
            const docs = await Event.find(query);
        
            // Render the HTML page with the fetched documents
            res.render('index', { events: docs });
        });


        // Event Details Page
      app.get('/events/:eventId', async (req, res) => {
          try {
            // Fetch a specific event from the database based on the eventId
            const eventId = req.params.eventId;
            const event = await Event.findById(eventId);
            const current_username = req.session.username;
            const userDocument = await User.findOne({ username: current_username });

            const applicantCount = await Application.countDocuments({ event_id: eventId });
    
            // Render the HTML page with the details of the specific event
            res.render('eventDetails', { current_username, event, userDocument, applicantCount });
          } catch (error) {
            console.error('Error fetching event details:', error);
            res.status(500).send('Internal Server Error');
          }
      });

      app.get('/applicants', async (req, res) => {
        try {
            const eventId = req.query.eventId;

            //find in applications by both event id and volunteer id
            const eventApplicants = await Application.find({ event_id: eventId });
            console.log(eventApplicants);

            res.render('applicants', { eventApplicants });
      
        } catch (error) {
            console.error('Error applying for event:', error);
            res.status(500).send('Internal Server Error');
        }
      
      });


        //Login requests
        app.post('/login', async (req, res) => {
          const { username, password } = req.body;
      
          try {
              // Fetch user from the database based on the provided username
              console.log(username + " " + password);
              const user = await User.findOne({ username });
              
              // Check if the user exists and the password is correct
              if (user && (password == user.password)) {
                  console.log("user found");
                  req.session.username = username;

                  // Authentication successful, redirect
                  res.redirect('/');
              } else {
                console.log("user not found");
                  // Authentication failed, render the login page with an error message
                  res.render('login', { errorMessage: 'Invalid username or password' });
              }
          } catch (error) {
              console.error('Error during login:', error);
              res.status(500).send('Internal Server Error');
          }
      });

      //volunteer sign up page
      app.post('/volunteerSignUp', async (req, res) => {
        const { username, password, first_name, last_name, email, skills } = req.body;
        const total_hours_worked = 0;
        const userType = "volunteer";
        const points = 0;
    
        try {
            //check if user already exists
            const existingUser = await User.findOne({ username });

            if (existingUser) {
              return res.status(400).send('User with this username already exists.');
            }
            else {
            // Create a new user instance
            const newUser = new User({ username, password, email, userType });
            //const newVolunteer = new Volunteer({ username, first_name, last_name, skills, total_hours_worked});
            const newVolunteer = new Volunteer({ username, first_name, last_name, skills: Array.isArray(skills) ? skills : [skills], total_hours_worked, points});

            const newAvatar = new Avatar({ username });
            console.log(newUser);
            console.log(newVolunteer);

             // Save the user to the database
             await newUser.save();
             await newVolunteer.save();
             await newAvatar.save();

             req.session.username = username;

             res.redirect("/");
            }
            
        } catch (error) {
            console.error('Error during Sign Up:', error);
            res.status(500).send('Internal Server Error');
        }
    });


    //organisation sign up page
    app.post('/orgSignUp', upload.single('logo_image'), async (req, res) => {
      const { username, password, email, org_name, address, aof } = req.body;
      const logo_image = req.file;
      const userType = "organisation";
  
      try {
          //check if user already exists
          const existingUser = await User.findOne({ username });

          if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

          if (existingUser) {
            return res.status(400).send('User with this username already exists.');
          }
          else {
          // Create a new user instance
          const newUser = new User({ username, password, email, userType });
          
          const newOrg = new Organisation({ username, org_name, address, aof: Array.isArray(aof) ? aof : [aof]});
          newOrg.logo_image = {
            data: fs.readFileSync(req.file.path),
            filename: logo_image.filename,
            contentType: logo_image.mimetype
          }

          console.log(newUser);
          console.log(newOrg);
          console.log('Multer Configuration:', upload);

           // Save the user to the database
           await newUser.save();
           await newOrg.save();

           req.session.username = username;

           res.redirect("/");
          }
          
      } catch (error) {
          console.error('Error during Sign Up:', error);
          res.status(500).send('Internal Server Error');
      }
  });
          
  //create event page
  app.post('/createEvent', upload.single('event_image'), async (req, res) => {  
    const { event_name, event_date, description, event_location, event_details, aof } = req.body;
    const org_id = req.session.username;
    const event_image = req.file;
    const date_created = new Date();
    const completion_status = false;

    try {
        //check if event already exists
        const existingEvent = await Event.findOne({ event_name });

        if (!req.file) {
          return res.status(400).send('No file uploaded');
      }

        if (existingEvent) {
          return res.status(400).send('Event with this name already exists.');
        }
        else {
        const newEvent = new Event({ org_id, event_name, date_created, event_date, description, event_location, event_details, aof: Array.isArray(aof) ? aof : [aof], completion_status });
        
        newEvent.event_image = {
          data: fs.readFileSync(req.file.path),
          filename: event_image.filename,
          contentType: event_image.mimetype
        }

        console.log(newEvent);

         // Save the user to the database
         await newEvent.save();

         //req.session.username = username;

         res.redirect("/profile");
        }
        
    } catch (error) {
        console.error('Error during event creation:', error);
        res.status(500).send('Internal Server Error');
    }
  });


  //edit Event page
  app.post('/editEvent/:eventId', upload.single('event_image'), async (req, res) => {
    const eventId = req.params.eventId;
    const { event_name, event_date, description, event_location, event_details, default_event_name, default_event_date, default_description, default_event_location, default_event_details } = req.body;
    const newImage = req.file;
    const updatedCheckboxes = req.body.aof || [];

    try {
        
        // Fetch the event details from the database based on eventId
        const event = await Event.findById(eventId);
        console.log("EDIT EVENT" + event.event_image);

        if (!event) {
            // Handle event not found
            return res.status(404).send('Event not found');
        }

        // Update event details based on the submitted form data
        event.event_name = event_name ? event_name : default_event_name;
        event.event_date = event_date ? event_date : default_event_date;
        event.description = description ? description : default_description;
        event.event_location = event_location ? event_location : default_event_location;
        event.event_details = event_details ? event_details : default_event_details;
        
        if (newImage) {
          event.event_image = {
            data: fs.readFileSync(newImage.path),
            filename: newImage.filename,
            contentType: newImage.mimetype
          };
        } 

        // Save the updated event to the database
        await event.save();
        await Event.findByIdAndUpdate(eventId, { aof: updatedCheckboxes });

        // Redirect back to the organization profile after editing the event
        res.redirect('/profile');
    } catch (error) {
        console.error('Error editing event:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/buy', async (req, res) => {
  const itemId = req.body.itemId;
  const username = req.session.username;

  //find from clothing, get price
  const clothingItem = await Clothing.findOne({ _id: itemId });
  const user = await Volunteer.findOne({ username });
  console.log(user.points);
  console.log(clothingItem.item_price);
  
  if (user.points >= clothingItem.item_price) {
    const newPurchasedClothing = new PurchasedClothing({ username, item_id: itemId });
    user.points -= clothingItem.item_price;

    await newPurchasedClothing.save();
    await user.save();

    res.redirect("/profile");
  }
  else {
    res.send('You do not have enough points to buy this item.');
  }
  
});


app.post('/apply', async (req, res) => {
  const { eventId } = req.body;
  const application_date = new Date();
  const attendance_status = 2;
  const hours_worked = 0;

  try {
      //use docs
      const event = await Event.findById(eventId);

      //find in applications by both event id and volunteer id
      const userEventApplications = await Application.find({ event_id: eventId, volunteer_id: req.session.username });
      console.log(userEventApplications);

      if (userEventApplications.length === 0) {
        //create new application
        const newApplication = new Application({ volunteer_id: req.session.username, event_id: eventId, application_date, attendance_status, hours_worked });
        newApplication.save();

        res.redirect('/profile');
      } else {
        //throw error
        return res.status(404).send('You have already applied for this event');
      }

  } catch (error) {
      console.error('Error applying for event:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/updateApplicant', async (req, res) => {
  const { applicantId, eventId, status, hoursworked } = req.body;

  try {
      //find by event and applicant id
      const application = await Application.findOne({ event_id: eventId, volunteer_id: applicantId });

      application.attendance_status = parseInt(status, 10);
      application.hours_worked += parseInt(hoursworked);

      console.log("UPDATE APPLICANT -- " + eventId);

      const volunteer = await Volunteer.findOne({ username: applicantId });
      volunteer.total_hours_worked += application.hours_worked;
      volunteer.points = application.hours_worked * 60;

      await application.save();
      await volunteer.save();

      res.send('Applicants updated successfully');

  } catch (error) {
      console.error('Error updating applicant:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.post('/equip', async (req, res) => {
  const { itemId } = req.body;
  const username = req.session.username;

  try {
     //find item in clothing
     const clothingItem = await Clothing.findOne({ _id: itemId });
     //add it to avatar model with equipped items

     const updatedAvatar = await Avatar.findOneAndUpdate(
      { username },
      { $push: { equippeditems: clothingItem.item_image } },
      { new: true }
    );

    if (!updatedAvatar) {
      return res.status(404).send('Avatar not found');
    }

    res.redirect('/profile');

  } catch (error) {
      console.error('Error updating applicant:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/unequip', async (req, res) => {
  const { itemId } = req.body;
  const username = req.session.username;

  try {
     //find item in clothing
     const avatarDocument = await Avatar.findOne({ username });
     const clothing = await Clothing.findOne({ _id: itemId });
     //add it to avatar model with equipped items

     avatarDocument.equippeditems = avatarDocument.equippeditems.filter(item => item !== clothing.item_image);

     avatarDocument.save();

     res.redirect('/profile');

  } catch (error) {
      console.error('Error updating applicant:', error);
      res.status(500).send('Internal Server Error');
  }
});
        // Close the connection
        // mongoose.connection.close();

    } catch (error) {
        console.log(error);
    }
}

  connect();

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });