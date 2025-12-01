import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 bg-white py-1 px-2">
      <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between gap-x-3 gap-y-0 text-[10px] md:text-sm text-gray-500">
        <div className="flex items-center">
          <Link to="/about" className="hover:text-indigo-600 transition-colors">
            About Us
          </Link>
        </div>
        <div className="order-last md:order-none w-full md:w-auto text-center mt-0.5 md:mt-0">
          &copy; {new Date().getFullYear()} LearnStream
        </div>
        <div className="flex gap-3">
          <Link
            to="/privacy"
            className="hover:text-indigo-600 transition-colors"
          >
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-indigo-600 transition-colors">
            Terms
          </Link>
          <Link
            to="/contact"
            className="hover:text-indigo-600 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
