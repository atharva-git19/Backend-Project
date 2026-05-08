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
    MONGODB*URI = mongodb+srv:atharva:AtharvaMongodb%4019@cluster0.vaedkag.mongodb.net (there is / at end of link normally. REMOVE IT)
    /* sincce there is @ in password in mongodb we cant use @ directly its written as %40\_/
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

4 making models of user and video with hooks and JWT
4.1 make user and video model as per the data model made at the top
4.2 install npm packages:

- mongoose-aggregate-paginate-v2 (for aggregate pagination on Video model)
- bcrypt (for hashing user passwords with pre-save hook)
- jsonwebtoken / JWT (for generating access and refresh tokens from User model methods)
  4.3 Password hashing hook and password check method in `user.model.js`

Code:
`userSchema.pre("save", function (next) {`
`    if (!this.isModified("password")) return next();`
`    this.password = bcrypt.hash(this.password, 10)`
`    next()`
`})`
`userSchema.methods.isPasswordCorrect = async function (password) {`
`    return await bcrypt.compare(password, this.password)`
`}`

What this is doing:

- `pre("save")` is a Mongoose middleware (hook) that runs right before a user document is saved.
- `if (!this.isModified("password")) return next();` prevents re-hashing when password is unchanged (for example, when only username/email is updated).
- `bcrypt.hash(this.password, 10)` converts the plain password to a secure hashed value using salt rounds `10`.
- `next()` tells Mongoose to continue saving after the middleware work is complete.
- `isPasswordCorrect()` is a custom schema method used during login to verify plain password input against the stored hashed password.
- `bcrypt.compare(password, this.password)` safely checks match without decrypting (hashes are one-way).

Why normal function is used:

- Use `function () {}` in schema middleware/methods when you need `this` to refer to the current document.
- Arrow functions do not bind their own `this`, so `this.password` and `this.isModified(...)` may not work as expected.

  4.4 Access token method in `user.model.js`

Code:
`userSchema.methods.generateAccessToken = function () {`
`    return jwt.sign(`
`        {`
`            _id: this._id,`
`            email: this.email,`
`            username: this.username,`
`            fullName: this.fullName`
`        },`
`        process.env.ACCESS_TOKEN_SECRET,`
`        {`
`            expiresIn: process.env.ACCESS_TOKEN_EXPIRY`
`        }`
`    )`
`}`

Why this is done:

- Access token is used after login to prove user identity on protected routes.
- The token is signed with `ACCESS_TOKEN_SECRET`, so clients cannot forge valid tokens.
- Keeping user claims (`_id`, `email`, `username`, `fullName`) in the payload helps backend read identity quickly without querying DB on every request.
- `expiresIn` keeps token short-lived, reducing risk if token is leaked.

How it works:

- Define a custom schema method on User so every user document can generate its own token.
- Use `jwt.sign(payload, secret, options)` to create a signed JWT string.
- Pull `secret` and `expiry` from `.env` for security and environment-specific config.
- Return the generated token from the method so controllers can send it in cookies or response body.

  4.5 Refresh token method in `user.model.js`

Code:
`userSchema.methods.generateRefreshToken = function () {`
`    return jwt.sign(`
`        {`
`            _id: this._id,`
`        },`
`        process.env.REFRESH_TOKEN_SECRET,`
`        {`
`            expiresIn: process.env.REFRESH_TOKEN_EXPIRY`
`        }`
`    )`
`}`

Why this is done:

- Refresh token is used to generate new access tokens without forcing user to login again.
- It contains minimal payload (`_id` only) to reduce exposed user data if token is compromised.
- It is signed with a separate secret (`REFRESH_TOKEN_SECRET`) so access and refresh token trust boundaries remain separate.
- It is usually configured with longer expiry than access token to support long sessions.

How it works:

- Add a schema method so each user document can create its own refresh token.
- Call `jwt.sign()` with a minimal payload, refresh secret, and refresh expiry from `.env`.
- Return the signed token string from this method.
- Store this token in DB and/or send it in secure httpOnly cookie, then verify it during token-rotation endpoint (refresh flow).

5 file uploading using cloudinary and multer

5.1 install both using npm install
5.2 Cloudinary utility (`src/utils/cloudinary.js`)

Why this utility is written:

- Multer stores uploaded files temporarily on local disk.
- We use Cloudinary to move that file from local temp storage to cloud storage (image/video/auto file support).
- After successful upload, we return Cloudinary response (URL, public_id, etc.) so controllers can save it in database.
- If upload fails, local temp file should be removed so server storage does not fill up.

How the code works (line-by-line intent):

- `cloudinary.config(...)` sets your Cloudinary credentials from `.env`.
- `uploadOnCloudinary(localFilePath)` accepts path of file saved by multer.
- `if (!localFilePath) return null` is a guard clause for invalid input.
- `cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })` uploads any file type.
- On success, function should log/use the upload result and return it.
- On error, function should delete temp local file and return `null`.

Important fixes needed in current code:

- `import { response } from "express"` is incorrect here and not needed.
- Upload call must be `await`ed, otherwise function may return before upload completes.
- `response.url` and `return response` are wrong because `response` is not upload result.
- In catch block, delete file only if path exists to avoid extra error.

Reference code (corrected version):

```js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Optional: remove temp file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    console.log("file has been uploaded on cloudinary", uploadResult.url);
    return uploadResult;
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

export { uploadOnCloudinary };
```

5.3 Multer middleware (`src/middlewares/multer.middleware.js`)

Intro:

- Multer is the middleware that handles incoming `multipart/form-data` from forms/Postman when user uploads files.
- Before sending file to Cloudinary, multer stores it in a temporary local folder.
- This middleware centralizes upload config so controllers can reuse same upload logic everywhere.

Why this file is written:

- To define where uploaded file should be stored (`destination`).
- To define what temporary filename should be (`filename`).
- To export a reusable upload middleware instance (`upload`) for routes.

How this code works:

- `multer.diskStorage({...})` creates custom disk storage configuration.
- `destination(req, file, cb)` tells multer to save file in `./public/temp`.
- `filename(req, file, cb)` currently keeps file name as original uploaded name.
- `export const upload = multer({ storage })` creates middleware you can use in routes like `upload.single("avatar")`.

Important note:

- Using `file.originalname` can cause name collisions (same filename uploaded by different users).
- Better practice is to generate unique filename (timestamp + random + extension).

Reference code (safer version):

```js
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({ storage });
```

How to use in route:

```js
router.post("/register", upload.single("avatar"), registerUser);
```

6. User controller — `src/controllers/user.controller.js`

This controller handles user-related API logic. The `registerUser` function creates a new user, uploads profile images, and returns a safe response without sensitive fields.

6.1 `registerUser` flow (simple explanation)

1. **Read request body**
   - Gets `fullName`, `email`, `username`, and `password` from `req.body`.

2. **Validate required fields**
   - If any field is missing/empty, it throws `400` with `"All fields are required"`.
   - It also checks basic email format (`email` contains `@`).

3. **Check existing user**
   - Queries MongoDB with:
     - same `username`, or
     - same `email`
   - If found, throws `409` conflict.

4. **Read uploaded files (from Multer)**
   - `req.files?.avatar?.[0]?.path` -> local path of avatar image.
   - `req.files?.coverImage?.[0]?.path` -> local path of cover image.
   - Optional chaining (`?.`) prevents crashes if files are missing.

5. **Ensure avatar is provided**
   - Avatar is mandatory in current logic.
   - If avatar path is missing, throws `400`.

6. **Upload images to Cloudinary**
   - Uploads avatar (required).
   - Uploads cover image only if provided.
   - Uses returned Cloudinary URLs for database storage.

7. **Create user document**
   - Saves user with:
     - profile image URLs
     - lowercased username
     - password (hashed by model pre-save hook)

8. **Fetch safe user data**
   - Re-queries user with:
     - `.select("-password -refreshToken")`
   - This ensures sensitive data is not returned.

9. **Send response**
   - Returns success response with created user data.

6.2 Why `req.files?.avatar?.[0]?.path` is used

- `req.files`: object created by Multer.
- `.avatar`: files uploaded under `avatar` field.
- `?.[0]`: first uploaded file in that field (safe access).
- `?.path`: local temp file path.
- Without `?.`, missing file fields can crash the request.

6.3 Route requirements

- Multer middleware must run before `registerUser`.
- Field names should match controller usage: `avatar`, `coverImage`.
- Typical route:

```js
router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
);
```

6.4 Common failure cases

- Missing form fields -> `400`
- Invalid email format -> `400`
- Duplicate email/username -> `409`
- Avatar not uploaded -> `400`
- DB create/fetch issue -> `500`

6.5 `generateAccessAndRefreshToken` flow (`user.controller.js`)

This helper creates JWT tokens for a user and stores refresh token in DB.

1. **Find user by id**
   - `const user = await User.findById(userId)`

2. **Generate tokens from model methods**
   - `user.generateAccessToken()`
   - `user.generaterefreshToken()`

3. **Store refresh token**
   - Saves refresh token in user document:
   - `user.refreshToken = refreshToken`
   - `await user.save({ validateBeforeSave: false })`

4. **Return both tokens**
   - Returns `{ accessToken, refreshToken }` to caller.

5. **Error handling**
   - Any failure throws `apiError(500, "...generating access and refresh token")`.

6.6 `loginUser` flow (`user.controller.js`)

This handler logs in user using email or username, verifies password, sets cookies, and returns user + tokens.

1. **Read body**
   - Reads `email`, `username`, and `password` from `req.body`.

2. **Validate identifier**
   - If both `username` and `email` are missing -> throws `400`.

3. **Find user**
   - Uses `$or` query with username/email.
   - If no user found -> throws `400` (`"User does not exist"`).

4. **Validate password**
   - If password missing -> throws `400`.
   - Verifies with `await user.isPasswordCorrect(password)`.
   - Wrong password -> throws `400`.

5. **Generate tokens**
   - Calls `generateAccessAndRefreshToken(user._id)`.

6. **Fetch safe user data**
   - Re-fetches user with `.select("-password -refreshToken")` before sending response.

7. **Set secure cookies**
   - Sets `accessToken` and `refreshToken` as cookies with:
   - `{ httpOnly: true, secure: true }`

8. **Send success response**
   - Returns HTTP `200` with:
   - user data
   - access token
   - refresh token

6.7 Login route notes

- To read cookies later, keep `cookie-parser` middleware enabled in app setup.
- `secure: true` cookies are only sent over HTTPS (expected in production).
- For local HTTP testing, you may need to conditionally set `secure` based on environment.
