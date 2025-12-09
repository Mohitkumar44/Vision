# Sentinel Vision: AI-Powered Object Tracking

Welcome to Sentinel Vision, a web application that leverages the power of generative AI to monitor a live camera feed and track the presence of a specific object. This project serves as a practical demonstration of using multimodal AI models to analyze video frames for object permanence, simulating a simple AI-powered security system.

## Core Functionality

Sentinel Vision uses your computer's webcam to capture a live video stream. You can describe an object (e.g., "my red laptop") and provide a reference image. The application then continuously analyzes the camera feed to determine if the described object is still present in the scene compared to the reference.

## Key Features

- **Live Camera Feed**: Displays a real-time feed from your default webcam.
- **AI-Powered Analysis**: Utilizes a Genkit flow with the Gemini AI model to compare a current camera frame with a reference frame.
- **Dynamic Object Description**: Users can specify what object the AI should look for.
- **Flexible Baseline**:
    - **Upload Reference**: Provide a static image of the object in its place to serve as the "correct" state.
    - **Set Live Baseline**: Capture the current camera view as the baseline to track changes against.
- **Visual Feedback**: When an object is detected, a bounding box is drawn around it directly on the live feed.
- **Event Logging**: Every analysis result (whether the object is "Present" or "Stolen") is logged with a timestamp, status, and the AI's explanation.
- **XML Log Export**: The entire event log can be downloaded as an XML file for record-keeping.

## Technology Stack

This project is built with a modern, full-stack TypeScript approach:

- **Frontend**: [Next.js](https://nextjs.org/) with React (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) for a professional and accessible component library.
- **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit) (specifically with the Gemini model from Google AI) to power the object analysis flow.
- **Icons**: [Lucide React](https://lucide.dev/) for clean and consistent icons.

## Getting Started

To get started with the application, please refer to the setup and running instructions provided separately. The main application logic can be found in `src/components/ObjectTrackerPage.tsx`, and the core AI logic is located in `src/ai/flows/analyze-object-permanence.ts`.
