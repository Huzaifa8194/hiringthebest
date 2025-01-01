import React, { useState } from "react";
import { Card, Col, Row, Button, Form, InputGroup } from "react-bootstrap";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

export default function PaycheckCalculator() {
  const [grossPay, setGrossPay] = useState("");
  const [deductions, setDeductions] = useState("");
  const [bonuses, setBonuses] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [netPay, setNetPay] = useState(null);

  const calculateNetPay = () => {
    const gross = parseFloat(grossPay) || 0;
    const totalDeductions = parseFloat(deductions) || 0;
    const totalBonuses = parseFloat(bonuses) || 0;
    const tax = parseFloat(taxRate) || 0;

    const taxableAmount = gross + totalBonuses - totalDeductions;
    const taxAmount = taxableAmount * (tax / 100);
    const finalPay = taxableAmount - taxAmount;

    setNetPay(finalPay.toFixed(2));
  };

  const resetCalculator = () => {
    setGrossPay("");
    setDeductions("");
    setBonuses("");
    setTaxRate("");
    setNetPay(null);
  };

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="main-title mb-0">Paycheck Calculator</h4>
        </div>

        <Row className="g-4">
          <Col lg="6">
            <Card className="card-one">
              <Card.Header>
                <Card.Title as="h6">Calculate Your Paycheck</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Gross Pay</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        placeholder="Enter gross pay"
                        value={grossPay}
                        onChange={(e) => setGrossPay(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Deductions</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        placeholder="Enter deductions"
                        value={deductions}
                        onChange={(e) => setDeductions(e.target.value)}
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Example: Insurance, Retirement Contributions, etc.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Bonuses</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        placeholder="Enter bonuses"
                        value={bonuses}
                        onChange={(e) => setBonuses(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tax Rate</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        placeholder="Enter tax rate (in %)"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                      />
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Form>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Button variant="secondary" onClick={resetCalculator}>
                  Reset
                </Button>
                <Button variant="primary" onClick={calculateNetPay}>
                  Calculate
                </Button>
              </Card.Footer>
            </Card>
          </Col>

          <Col lg="6">
            <Card className="card-one text-center">
              <Card.Body>
                <h5 className="mb-4">
                  Ready to see your <span className="text-primary">take-home pay?</span>
                </h5>
                {netPay !== null ? (
                  <div className="paycheck-result">
                    <h3>Your Net Pay</h3>
                    <h1 className="text-success display-4">
                      ${netPay}
                    </h1>
                    <p className="text-muted">This is your estimated take-home pay.</p>
                  </div>
                ) : (
                  <p className="text-muted">Enter your details to calculate your paycheck.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Additional Paycheck Information */}
        <Row className="g-4 mt-4">
          <Col lg="4">
            <Card className="card-one">
              <Card.Body>
                <h6>What is Gross Pay?</h6>
                <p className="text-muted">
                  Gross pay is the total amount of money you earn before taxes,
                  deductions, or contributions are taken out.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-one">
              <Card.Body>
                <h6>What are Deductions?</h6>
                <p className="text-muted">
                  Deductions are amounts taken out of your paycheck, such as
                  insurance premiums, retirement contributions, and more.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-one">
              <Card.Body>
                <h6>How is Tax Calculated?</h6>
                <p className="text-muted">
                  Taxes are calculated based on the taxable income after adding
                  bonuses and subtracting deductions.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Footer />
      </div>
    </React.Fragment>
  );
}
