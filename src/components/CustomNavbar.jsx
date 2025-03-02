"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaBars, FaTimes, FaGoogle } from "react-icons/fa";
import { signIn, signOut, useSession, getProviders } from "next-auth/react";
import Link from "next/link";

const CustomNavbar = ({ logoSrc }) => {
  const { data: session } = useSession();
  const profileImage = session?.user?.image;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [providers, setProviders] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    setAuthProviders();
  }, []);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 mt-5 transition-transform duration-300">
      <div className="max-w-[70%] mx-auto flex items-center justify-between py-2 px-4 bg-white bg-opacity-20 backdrop-blur-xl shadow-xl rounded-3xl transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center">
          <Link className="flex flex-shrink-0 items-center" href="/">
            <Image
              src={logoSrc}
              alt="logo"
              width={100}
              className="h-auto cursor-pointer hover:scale-110 transition-transform duration-300 rounded-full"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/Documents"
            className="text-white text-lg font-medium hover:text-gray-400 transition duration-300 px-5"
          >
            Documents
          </Link>
          {!session && providers && (
            <button
              onClick={() => signIn(Object.values(providers)[0].id)}
              className="flex items-center text-white bg-gray-700 hover:bg-gray-900 hover:text-white rounded-md px-3 py-2"
            >
              <FaGoogle className="text-white mr-2" />
              <span>Login or Register</span>
            </button>
          )}
          {session && (
            <>
              <button
                type="button"
                className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-haspopup="true"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              >
                <Image
                  className="h-8 w-8 rounded-full"
                  src={profileImage}
                  alt="Profile"
                  width={40}
                  height={40}
                />
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="md:hidden">
          <button
            className="text-blue-500 p-2 transition-transform duration-300"
            onClick={toggleDrawer}
          >
            {open ? (
              <FaTimes className="transform hover:scale-125 transition-transform duration-300 text-2xl" />
            ) : (
              <FaBars className="transform hover:scale-125 transition-transform duration-300 text-2xl" />
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white p-4 transition-all duration-300 ease-in-out">
          {!session &&
            providers &&
            Object.values(providers).map((provider, index) => (
              <button
                onClick={() => signIn(provider.id)}
                key={index}
                className="flex items-center text-white bg-gray-700 hover:bg-gray-900 hover:text-white rounded-md px-3 py-2 my-4"
              >
                <FaGoogle className="text-white mr-2" />
                <span>Login or Register</span>
              </button>
            ))}
        </div>
      )}
    </nav>
  );
};

CustomNavbar.propTypes = {
  logoSrc: PropTypes.string.isRequired,
};

export default CustomNavbar;
