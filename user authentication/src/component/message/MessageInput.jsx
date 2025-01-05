import { useForm } from "react-hook-form";
import axios from "axios"; // Import axios

const MessageInput = () => {
  const { handleSubmit, register } = useForm(); // Destructuring handleSubmit and register

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const response = await axios.post("http://localhost:3001/send-message", {
        message: data.message, // Send the message to the server
      });
      console.log("Message Sent:", response.data); // Log the server response
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Define the onClick callback
  const handleClick = (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    handleSubmit(onSubmit)(); // Manually trigger the form submission handler
  };

  return (
    <form
      className="px-4 my-3 position-relative"
      onSubmit={handleSubmit(onSubmit)} // Form submission handler
    >
      <div className="w-100 position-relative">
        <input
          {...register("message")} // Registering the input field for the message
          type="text"
          className="form-control text-white bg-dark border-secondary rounded"
          placeholder="Send a message"
        />
        <button
          type="submit"
          onClick={handleClick} // Attach the onClick event
          className="btn btn-primary position-absolute top-50 translate-middle-y end-0 pe-3"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
