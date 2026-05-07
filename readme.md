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

This file defines HTTP handlers for user-related actions. Right now it implements **registration** (`registerUser`). Controllers sit between routes and services/utilities: they read `req`, validate input, call the database and Cloudinary, and send standardized JSON via `apiResponse` or throw `apiError` (handled by your global error middleware when wired).

6.1 Imports (what each piece does)

| Import               | Role in this file                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `asyncHandler`       | Wraps `registerUser` so returned/rejected Promises become `next(err)` and you avoid repeating `try/catch` in the handler.                       |
| `apiError`           | Thrown for expected failures (validation, conflict, server issues). Your error middleware should map these to HTTP responses.                   |
| `User`               | Mongoose model used for `findOne`, `create`, and re-querying the saved user.                                                                    |
| `uploadOnCloudinary` | Takes a **local disk path** (from Multer), uploads to Cloudinary, returns a result object with `.url` (or `null` on failure — see notes below). |
| `apiResponse`        | Wraps success payloads in a consistent JSON shape (`statusCode`, `data`, `message`, `success`).                                                 |

6.1.1 Syntax note: `req.files?.avatar?.[0]?.path`

This expression safely reads the **local temp file path** Multer stored for the first uploaded file in the `avatar` field. Read it from **left to right**:

| Part        | Meaning                                                                                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req.files` | Object Multer sets on the request when you use middleware like `upload.fields(...)`. Keys are **field names** from the form; values are **arrays** of file info objects (one entry per file for that field).                |
| `?.`        | **Optional chaining.** If the value to the left is `null` or `undefined`, evaluation **stops** and the whole expression becomes `undefined` — no `TypeError` from reading a property off nothing.                           |
| `.avatar`   | The uploaded field named `avatar` (must match the name in your form and in `upload.fields([{ name: "avatar", ... }])`).                                                                                                     |
| `?.[0]`     | The first file in that field’s array. **`?.` before `[0]`** matters: with `req.files?.avatar[0]`, if `avatar` is missing you get `undefined[0]`, which **throws**. Writing `?.[0]` means “only index when `avatar` exists.” |
| `?.path`    | Each Multer file object includes `path` (full path to the temp file on disk). Optional chaining covers a missing or malformed entry.                                                                                        |

**Equivalent idea in plain steps:** “If `req.files` exists, then if `avatar` exists, then if element `0` exists, return its `path`; otherwise `undefined`.”

**Contrast without optional chaining:** `req.files.avatar[0].path` assumes every step exists; any missing step crashes the request handler.

6.2 `registerUser` — end-to-end flow (maps to comments at top of file)

The block comment at lines 7–15 is the checklist the handler implements:

1. **Read body** — `fullName`, `email`, `username`, `password` from `req.body`. The client should send these as form fields (with `multipart/form-data` if files are included).

2. **Validate text fields** — Any of the four missing or whitespace-only triggers `400` with `"All fields are required"`. Email must contain `@` (`400` with `"correct email is required"`). This is a light check; you can later swap in a proper email validator or schema validation (e.g. Zod / express-validator).

3. **Uniqueness** — `await User.findOne({ $or: [{ username }, { email }] })`. **Always `await`** here: without it you get a Promise, which is always truthy and would incorrectly block every registration. If a document exists → `409` `"User with same email or username already exist"`.

4. **Files** — Reads Multer paths: `req.files?.avatar?.[0]?.path` and `req.files?.coverImage?.[0]?.path`. See **6.1.1** for a line-by-line explanation of that syntax.

5. **Avatar required** — If there is no `avatarLocalPath` → `400` `"Avatar file is required"`. Cover image is optional for the check; upload still runs for cover (see 6.4).

6. **Cloudinary** — Uploads avatar (required path) then cover (may be `undefined`). Stored URLs go into MongoDB on create.

7. **`User.create`** — Persists user with `avatar: avatar.url`, `coverImage: coverImage?.url || ""`, normalized `username: username.toLowerCase()`, and plain `password` (hashed by the User model `pre("save")` hook).

8. **Re-fetch for response** — After create, the handler loads the user again and applies `.select("-password -refreshToken")` so the JSON never includes secrets. **Mongoose convention:** use the **model** for static queries, e.g. `User.findById(user._id)`, not `user.findById` on the document instance (`findById` is a Model method).

9. **Response** — `201` HTTP status with `new apiResponse(200, createdUser, "User registered succesfully")`. Note: `res.status(201)` and the first argument to `apiResponse` (`200`) can disagree; consider using the same code in both places so clients and logs stay consistent.

6.3 What the route must provide

- **Multer (or equivalent)** must run before this handler so `req.files` and temp paths exist. Field names should match what the controller reads (`avatar`, `coverImage`). Example: `upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }])` on the register route.
- **Body parser** for non-file fields when using multipart forms (often `express.urlencoded` plus Multer).

  6.4 Edge cases worth knowing

- **`uploadOnCloudinary` returns `null`** when `localFilePath` is falsy or upload fails (see `cloudinary.js`). If avatar upload fails, `avatar.url` can throw. A robust flow checks `if (!avatar?.url)` after upload and responds with `500` or `400` before `User.create`.
- **Cover image omitted** — `uploadOnCloudinary(coverImageLocalPath)` receives `undefined` and returns `null` early; `coverImage?.url || ""` keeps the schema happy when cover is optional in the UI.
- **Duplicate avatar check** — The file validates `avatarLocalPath` before and after upload; the second check is redundant and can be removed for clarity.

  6.5 Errors thrown (by status)

| Situation                   | Typical status | Message (as in code)                           |
| --------------------------- | -------------- | ---------------------------------------------- |
| Missing/blank core fields   | 400            | All fields are required                        |
| Email without `@`           | 400            | correct email is required                      |
| Duplicate username/email    | 409            | User with same email or username already exist |
| No avatar file              | 400            | Avatar file is required                        |
| Re-query after create fails | 500            | something went wrong while registering User    |

6.6 Exports

- Only `registerUser` is exported today. Add named exports here as you implement login, profile update, etc., and import them from your user routes file.
