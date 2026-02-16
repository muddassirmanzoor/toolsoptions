import sys
import PyPDF2

file_path = 'example_password.txt'

# Initialize an empty list to hold the passwords
passwords = []

# Open the file and read its contents
with open(file_path, 'r') as file:
    for line in file:
        # Strip any extra whitespace and add the password to the list
        password = line.strip()
        if password:  # Ensure we don't add empty lines
            passwords.append(password)

# Create the variable EXAMPLE_PASSWORDS
EXAMPLE_PASSWORDS = passwords

def try_decrypt(reader, password):
    try:
        reader.decrypt(password)
        # Attempt to read the first page to confirm decryption
        reader.pages[0]
        return True
    except (PyPDF2.errors.PdfReadError, IndexError):
        return False

def unprotect_pdf(input_path, output_path, password=None):
    try:
        print(f"Opening PDF file: {input_path}")

        # Read the existing PDF
        with open(input_path, 'rb') as input_file:
            reader = PyPDF2.PdfReader(input_file)

            # Check if the PDF is encrypted
            if reader.is_encrypted:
                if password:
                    # Try the provided password
                    if not try_decrypt(reader, password):
                        raise ValueError("Incorrect password")
                else:
                    # Try example passwords if none is provided
                    decrypted = False
                    for example_password in EXAMPLE_PASSWORDS:
                        if try_decrypt(reader, example_password):
                            print(f"Decryption successful with example password: {example_password}")
                            password = example_password
                            decrypted = True
                            break

                    if not decrypted:
                        raise ValueError("Unable to decrypt PDF with example passwords")

            writer = PyPDF2.PdfWriter()

            # Copy all pages to the writer
            for page_num in range(len(reader.pages)):
                writer.add_page(reader.pages[page_num])

            # Write out the unprotected PDF
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)

        print(f"Unprotected PDF saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) not in [3, 4]:
        print("Usage: python unprotect_pdf.py <input_path> <output_path> [password]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    password = sys.argv[3] if len(sys.argv) == 4 else None
    unprotect_pdf(input_path, output_path, password)
