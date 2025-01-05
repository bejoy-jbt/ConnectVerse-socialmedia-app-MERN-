import { useForm, Controller } from "react-hook-form"; // Importing necessary functions from react-hook-form
import InputText from "./InputText"; // Assuming InputText is a custom input component

const ExampleForm = () => {
  const { handleSubmit, control, formState: { errors } } = useForm(); // Setting up form handling and error management

  // Handle form submission
  const onSubmit = (data) => {
    console.log("Form Data: ", data); // Log form data on submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="row p-3">
      <div className="col-md-9">
        <div className="row">
          <Controller
            name="AcademicTerm" // Name of the field
            control={control} // Pass control to Controller
            render={({ field }) => (
              <InputText
                {...field} // Spread the field props here
                className="select"
                options={academicTerm} // Assuming academicTerm is an array of options
                isMulti={false} // Can be set to true if it's a multi-select input
              />
            )}
          />
          {errors.AcademicTerm && <span className="text-danger">{errors.AcademicTerm.message}</span>}
        </div>
      </div>
      <button type="submit" className="btn btn-primary">Submit</button>
    </form>
  );
};

export default ExampleForm;
