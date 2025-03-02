// import CustomQwenChat from "@/components/CustomQwenChat";
// import Query from "@/components/Query";
// import TextractUploader from "@/components/TextractUploader";
// import Image from "next/image";

// export default function Home() {
//   return (
//     <main>
//       {/* <Query/> */}
//       {/* <TextractUploader/> */}
//       {/* <CustomQwenChat/> */}
      
//     </main>
//   );
// }
"use client";

// import { motion } from "framer-motion";
// import React from "react";
// import { AuroraBackground } from "@/components/ui/aurora-background";

// const AuroraBackgroundDemo = () => {
//   return (
//     <AuroraBackground>
//       <motion.div
//         initial={{ opacity: 0.0, y: 40 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         transition={{
//           delay: 0.3,
//           duration: 0.8,
//           ease: "easeInOut",
//         }}
//         className="relative flex flex-col gap-4 items-center justify-center px-4"
//       >
//         <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
//           Background lights are cool you know.
//         </div>
//         <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
//           And this, is chemical burn.
//         </div>
//         <button className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2">
//           Debug now
//         </button>
//       </motion.div>
//     </AuroraBackground>
//   );
// };

// export default AuroraBackgroundDemo;
import React, { useState } from "react";
import Link from "next/link";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";

const BackgroundBeamsWithCollisionDemo = () => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <BackgroundBeamsWithCollision className="bg-black flex flex-col items-center text-center">
      {/* Heading */}
      <h2 className="text-2xl relative z-20 md:text-4xl lg:text-7xl font-bold text-white dark:text-white font-sans tracking-tight">
        From Chaos to Clarity{" "}
        <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
          <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
            <span className="">AI’s on Duty.</span>
          </div>
          <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
            <span className="">AI’s on Duty.</span>
          </div>
        </div>
      </h2>

      {/* Button Section */}
      <div className="mt-6">
        {!showOptions ? (
          <button
            onClick={() => setShowOptions(true)}
            className="px-6 py-3 text-4xl font-semibold text-white bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full shadow-lg hover:opacity-90 transition duration-300"
          >
            Get Sorted Now
          </button>
        ) : (
          <div className="flex gap-4 mt-4">
            <Link
              href="/integrated"
              className="px-6 py-3 text-2xl font-semibold text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-lg hover:opacity-90 transition duration-300"
            >
              Document Analysis
            </Link>
            <Link
              href="/categorise"
              className="px-6 py-3 text-2xl font-semibold text-white bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-full shadow-lg hover:opacity-90 transition duration-300"
            >
              Document Classification
            </Link>
          </div>
        )}
      </div>
    </BackgroundBeamsWithCollision>
  );
};

export default BackgroundBeamsWithCollisionDemo;
