package com.tranminh.medicalclinic.entity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "prescription_details")
public class PrescriptionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(nullable = false, length = 100)
    private String dosage;

    @Column(nullable = false, length = 100)
    private String frequency;

    @Column(nullable = false, length = 100)
    private String duration;

    private Integer quantity;

    @Column(length = 500)
    private String instruction;

    protected PrescriptionDetail() {
    }

    public PrescriptionDetail(Prescription prescription, Medicine medicine, String dosage, String frequency,
                              String duration, Integer quantity, String instruction) {
        this.prescription = prescription;
        this.medicine = medicine;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.quantity = quantity;
        this.instruction = instruction;
    }

    public Medicine getMedicine() { return medicine; }
    public String getDosage() { return dosage; }
    public String getFrequency() { return frequency; }
    public String getDuration() { return duration; }
    public Integer getQuantity() { return quantity; }
    public String getInstruction() { return instruction; }
}
