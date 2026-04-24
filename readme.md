Data Model used = LastPush - https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj

1.Setting up:-
1.1 create node project using npm init
1.2 connect project to git repo  
 1.3 add .env and .gitignore files
1.4 add files to be ignored by git in .gitignore using gitignore generator
1.5 install nodemon to refresh server everytime changes occure (only for development ease)
"scripts": {
"dev": "nodemon src/index.js"
}, add this to package.json
1.6 cheange type from commonjs to module in package.json
"type": "module"
1.7 install dotenv mongoose and express
npm i mongoose express dotenv

2.  connectiong to mongodb atlas :-
    2.1 create project on mongodb atlas creat cluster aswell.
    2.2 copy the connection string and past it into .env file
    PORT = 8000
    MONGODB_URI = mongodb+srv:atharva:AtharvaMongodb%4019@cluster0.vaedkag.mongodb.net (there is / at end of link normally. REMOVE IT)
    /_ sincce there is @ in password in mongodb we cant use @ directly its written as %40_/
    2.3 connect database to project via db/index.js or in direct main index file
    const connectDB = async () => {
    try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); //connects to database
    console.log(`\n MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
              } catch (error) {
                  console.log("ERROR: ", error); catcheds error
                  process.exit(1);
              }
          }
          export default connectDB;
 

3 custom api responses
  3.0 import express,cors, cookieparser
  3.1 install npm cookie parser and cors
    cors is used to control which frontend origins can call your API from browsers.
    cookie-parser is used to read cookies sent by the client. (use as parsing middleware)
  3.2 configuration:
    3.2.1 config cors using app.use(cors()) and you can further congif adding object in like website allow and credentials etc

    3.2.2 app.use(express.json({limit : "16kb"})) config of cookie parse and we can add limit to how mg a json file ca take the information
    3.2.3 app.use(express.urlencoded({ extended: true, limit: "16kb" })) parses form data
    3.2.4 app.use(express.static("public")) //to store static public assets (ps. public is just folder name can be anything)
    3.2.5 app.use(cookieParser()) Parses cookies from incoming requests and makes them available in req.cookies. Useful for auth tokens/session values stored in cookies.
  
  3.3 add utilities such as apierror, apiresopnse, asynchandler 
    3.3.1 apierror and apiresponse sets a standardize json fomrmat to get errors and response in same way from anywhere which makes errors and response consistant
    3.3.2 asynchhandler is wrapper for async express route function so we don't need try/catch in every handler. Without this utility, unhandled async errors can crash flow or require repetitive try/catch in every route.
    

