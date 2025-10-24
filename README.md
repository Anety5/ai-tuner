# Idea Optimizer AI - Chrome Extension

**Idea Optimizer AI** is a powerful Chrome Extension designed to be your all-in-one brainstorming partner and creative assistant. Whether you're a student, a professional, a writer, or a developer, this tool leverages the power of Google's Gemini AI to help you generate, refine, and perfect your ideas for any topic.

The extension launches in its own movable, resizable window, allowing you to use it seamlessly across multiple monitors and alongside your other applications. It intelligently uses a hybrid AI approach, prioritizing Chrome's built-in, on-device model for speed and privacy, while providing a powerful cloud-based model as a fallback to ensure it works for everyone.

## Features

- **Multi-Purpose AI Tasks**:
  - **Optimize**: Take a raw concept and have the AI expand, refine, and structure it into a more complete idea.
  - **Summarize**: Paste in long articles, research papers, or documents to get a quick, concise summary.
  - **Proofread**: Clean up your text with a single click. The AI corrects grammar, spelling, and typos while preserving your original intent.

- **Hybrid AI Model**:
  - **Nano (On-Device)**: Uses Chrome's built-in AI for fast, offline, and private processing.
  - **Flash (Cloud)**: Seamlessly falls back to a powerful server-side model for users without built-in AI or for more complex tasks.

- **Fine-Grained Controls**:
  - **Creativity Slider**: Adjust the AI's output from highly factual and conventional to wildly imaginative and "blue-sky."
  - **Complexity Slider**: Tailor the response to your audience, from a simple, easy-to-understand explanation to a complex, expert-level analysis.

- **Advanced Educational & Professional Settings**:
  - **Educational Levels**: Switch between `General`, `K-12`, and `University` modes to adapt the AI's language and depth for the right audience.
  - **Plagiarism Guard**: When in an educational mode, enable this feature to instruct the AI to synthesize information and avoid direct quotes, ensuring originality.
  - **Smart Coding & STEM Assistant**: Ask for code in any language or help with complex topics in mathematics, physics, or biology, and receive well-formatted, commented responses.

- **Accessibility & Ease of Use**:
  - **Detachable Window**: The extension opens in its own window that you can move, minimize, and resize, perfect for multi-monitor setups.
  - **Microphone Input**: Speak your ideas directly into the app using your computer's microphone.
  - **Read Aloud (Text-to-Speech)**: Have the AI's generated response read back to you in a clear voice.

## Installation and Usage

To get the Idea Optimizer AI working in your Chrome browser, follow these simple steps.

### Step 1: Create the Icons

This extension needs three icon files. You can easily create them from the new logo.

1.  Open the file `components/icons/Logo.tsx`.
2.  Copy the entire `<svg>...</svg>` code block.
3.  Go to an online SVG to PNG converter (like `svgtopng.com`).
4.  Paste the SVG code and convert it to PNGs of the following sizes:
    -   `16x16`
    -   `48x48`
    -   `128x128`
5.  Create a new folder named `icons` in the main directory of your project.
6.  Save the PNGs in the `icons` folder with these exact names: `icon16.png`, `icon48.png`, `icon128.png`.

### Step 2: Open Chrome's Extensions Page

1.  Open your Google Chrome browser.
2.  In the address bar, type `chrome://extensions` and press **Enter**.
3.  Alternatively, click the three vertical dots (`⋮`) in the top-right corner, go to **Extensions**, and select **Manage Extensions**.

### Step 3: Enable Developer Mode

On the Extensions page, find the **Developer mode** toggle in the top-right corner and turn it **ON**. This will enable new options for loading custom extensions.

### Step 4: Load the Extension

1.  Click the **Load unpacked** button that appeared in the top-left.
2.  A file browser will open. Navigate to and select the folder containing all the project files.
3.  Click **Select Folder**.

### Step 5: Launch and Use

The "Idea Optimizer AI" extension is now installed!

-   Click the puzzle piece icon (`🧩`) in your Chrome toolbar.
-   Find **Idea Optimizer AI** in the list and click it to launch the application.
-   **Pro Tip**: Click the pin icon next to it in the list to keep it on your toolbar for easy one-click access.

Now you're ready to start optimizing your ideas!
