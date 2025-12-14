import mongoose from "mongoose";

const materiaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
});

const Materia = mongoose.model("Materia", materiaSchema);
export default Materia;
